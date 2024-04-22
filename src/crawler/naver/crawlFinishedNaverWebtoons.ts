import { crawlNaverWebtoons } from './crawlNaverWebtoons';
import { getHtmlData } from './getHtmlData';
import { NAVER_WEBTOON_URL } from '.';
import { UpdateDay, Webtoon } from '../../types';

/** 완결 웹툰 크롤링 */
export const crawlFinishedNaverWebtoons = async () => {
  // 페이지 링크
  const $ = await getHtmlData(NAVER_WEBTOON_URL + '/webtoon/finish.nhn?page=1');

  // 총 페이지 수
  const pageCount = Number(
    $('#ct > div.section_list_toon > div.paging_type2 > em > span').text(),
  );

  // Array.from(유사 배열 객체, 값) : 유사 배열 또는 이터러블 객체를 새 배열로 변환
  const pageList = Array.from({ length: pageCount }, (_, i) => i + 1);

  // 배열 초기화
  const finishedWebtoons: Webtoon[] = [];

  // 각 페이지를 비동기적으로 크롤링
  await Promise.all(
    pageList.map(async (page) => {
      // 네이버 웹툰 크롤링
      const webtoonsOfPage = await crawlNaverWebtoons(
        'finish', // type
        `page=${page}`, // query
        [UpdateDay.FINISHED], // updateDays
      );
      finishedWebtoons.push(...webtoonsOfPage);
    }),
  );

  return finishedWebtoons;
};

crawlFinishedNaverWebtoons();
