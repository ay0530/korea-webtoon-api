import { NAVER_WEBTOON_URL } from '.';
import { getHtmlData } from './getHtmlData';
import { Webtoon, Singularity, ServiceCode, Service } from '../../types';
import { standardizeChars } from 'utils';

/** 네이버 웹툰 크롤링 */
export async function crawlNaverWebtoons(
  type: 'weekday' | 'finish',
  query: string,
  updateDays: Webtoon['updateDays'],
  commonSingularityList: Singularity[] = [],
) {
  // 페이지 링크
  const $ = await getHtmlData(
    `${NAVER_WEBTOON_URL}/webtoon/${type}.nhn?${query}`,
  );

  // 웹툰 정보
  const rootElement = $('#ct > div.section_list_toon > ul > li > a');

  // 웹툰 정보 반환
  return rootElement
    .map((_, element) => {
      // 뱃지 여부
      const badgeAreaText = $(element).find('span.area_badge').text();

      const isNewWebtoon = badgeAreaText.includes('신작');
      const isAdultWebtoon = badgeAreaText.includes('청유물');

      const singularityList = [...commonSingularityList];
      const isWaitFreeWebtoon = badgeAreaText.includes('유료작품');
      if (isWaitFreeWebtoon) {
        singularityList.push(Singularity.WAIT_FREE);
      }

      // 업데이트 현황
      const titleBoxText = $(element).find('div.title_box').text();
      const isPausedWebtoon = titleBoxText.includes('휴재');
      const isUpdatedWebtoon = titleBoxText.includes('업데이트');

      // 관심 수
      const fanCountText = $(element)
        .find('div.info > span.favcount > span.count_num')
        .text();

      // 천까지 해도 되지 않을까 ? - 아영
      const fanCount = fanCountText.includes('만')
        ? Number(fanCountText.replace('만', ''))
        : fanCountText.includes('억')
        ? Number(fanCountText.replace('억', '')) * 10000
        : null;

      // 웹툰 상세 정보 주소
      const path = $(element).attr('href');

      // 웹툰 제목
      const title = $(element).find('.title').text();

      // 웹툰 작가
      const author = $(element)
        .find('.author')
        .text()
        // replaceAll과 replace의 속도 차이가 있을까 ?
        // .replaceAll(' / ', ',')
        // .replaceAll('\n', '')
        // .replaceAll('\t', '');
        .replace(' / ', ',')
        .replace(/\n|\t/g, '');

      // 웹툰 번호
      // 웹툰 ID랑 타이틀 ID랑 다른거 ???? - 아영
      const titleId = path
        ? Number(path.split('?titleId=')[1].split('&')[0])
        : 0;
      console.log('titleId: ', titleId);

      // 웹툰 정보 정리
      const webtoon: Webtoon = {
        webtoonId: ServiceCode.NAVER + titleId, // 서비스코드 추가하는 이유가 뭐임 ? 카카오 네이버 구분인가 굳이 해야할 필요가 있나 ? service 필드가 잇잔아 - 아영

        title,

        author,

        searchKeyword: standardizeChars(title + author),

        url: NAVER_WEBTOON_URL + path,

        img: $(element).find('div.thumbnail > img').attr('src') || '',

        service: Service.NAVER,
        fanCount,
        updateDays,
        additional: {
          new: isNewWebtoon,
          adult: isAdultWebtoon,
          rest: isPausedWebtoon,
          up: isUpdatedWebtoon,
          singularityList,
        },
      };

      return webtoon;
    })
    .get();
}
