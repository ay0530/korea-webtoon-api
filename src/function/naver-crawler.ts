import type { Webtoon } from '../types/webtoon';
import axios from 'axios';
import { load } from 'cheerio';
const naver_webtoon_url = 'https://m.comic.naver.com';
import * as fs from 'fs';
const load_$ = async (url: string) => {
  const html: { data: string } = await axios.get(url);
  return load(html.data);
};

export default async function naver_crawler() {
  console.log(`naver crawler start (${new Date()})`);
  const weekdayWebtoon = await get_weekdayWebtoon();
  fs.writeFileSync(
    '../../data/naver-weekday-webtoon.json',
    JSON.stringify(weekdayWebtoon),
  );
  const finishedWebtoon = await get_finishedWebtoon();
  fs.writeFileSync(
    '../../data/naver-finished-webtoon.json',
    JSON.stringify(finishedWebtoon),
  );
  console.log(`naver crawler end (${new Date()}`);
  return { weekdayWebtoon, finishedWebtoon };
}

/**한 url에 표시되는 모든 웹툰 정보를 가지고오는 함수
 * @param type 웹툰의 종류(weekday, finish)
 * @param query 웹툰의 페이지 정보(week=mon, page=1)
 * @param index 웹툰의 요일(0~6) / 완결(7)
 */
async function get_webtoonData(
  type: 'weekday' | 'finish',
  query: string,
  weekday: number,
): Promise<Webtoon[]> {
  const $ = await load_$(`${naver_webtoon_url}/webtoon/${type}.nhn?${query}`);
  const baseSelector = $('#ct > div.section_list_toon > ul > li > a');
  return baseSelector
    .map((index, element) => {
      const adult =
        $(element).find('div.thumbnail > span > span').attr('class') ===
        'badge adult'
          ? true
          : false;
      return {
        title: $(element).find('.title').text(),
        artist: $(element).find('.author').text(),
        url: naver_webtoon_url + $(element).attr('href'),
        img: $(element).find('div.thumbnail > img').attr('src'),
        service: 'naver',
        weekday: weekday,
        adult: adult,
      };
    })
    .get();
}

async function get_weekdayWebtoon() {
  const weekdayArr = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const weekdayWebtoon = await Promise.all(
    weekdayArr.map(
      async (weekday, index) =>
        await get_webtoonData('weekday', `week=${weekday}`, index),
    ),
  );
  return [
    ...weekdayWebtoon[0],
    ...weekdayWebtoon[1],
    ...weekdayWebtoon[2],
    ...weekdayWebtoon[3],
    ...weekdayWebtoon[4],
    ...weekdayWebtoon[5],
    ...weekdayWebtoon[6],
  ];
}

async function get_finishedWebtoon() {
  let finishedWebtoon = [];
  const $ = await load_$(naver_webtoon_url + '/webtoon/finish.nhn?page=1');
  const pageCount = Number(
    $('#ct > div.section_list_toon > div.paging_type2 > em > span').text(),
  );
  for (let page = 1; page < pageCount; page++) {
    finishedWebtoon.push(
      ...(await get_webtoonData('finish', `page=${page}`, 7)),
    );
  }
  return finishedWebtoon;
}