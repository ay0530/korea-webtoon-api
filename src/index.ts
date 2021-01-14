import path from "path";
import { Worker } from "worker_threads";
import express from "express";
import cors from "cors";
import http from "http";
import type { A_webtoon_info } from "./korean-webtoon-api/modules/base_modules";
//호스팅 서버 슬립 방지
setInterval(function () {
  http.get("http://toy-projects-api.herokuapp.com/");
}, sec(600));

//--------------------------------------------------------------------------------
//main 실행 함수
const main = (): void => {
  //호스팅 시작과 동시에 전체 데이터 1회 업데이트
  hosting_start();
  webtoon_update();
  trade_update();

  //1분 간격으로 전체 data 업데이트
  setInterval(function () {
    webtoon_update();
    trade_update();
  }, sec(60));
};
//--------------------------------------------------------------------------------

//webtoon업데이트 워커 실행
let webtoon_info_json: A_webtoon_info[] = [];
const webtoon_update = (): void => {
  let workerPath_webtoon_info = path.join(__dirname, "./korean-webtoon-api/worker/webtoon_info.js");
  let webtoon_info = new Worker(workerPath_webtoon_info);
  webtoon_info.on("message", (webtoon_info) => {
    webtoon_info_json = webtoon_info;
    webtoon_info_json.sort((a, b) => {
      return a.title < b.title ? -1 : 1;
    });
  });
};

let trade_info_json: object[] = [];
const trade_update = (): void => {
  let workerPath_trade_info = path.join(__dirname, "./insider-trade-api/worker/trade_info.js");
  let trade_info = new Worker(workerPath_trade_info);
  trade_info.on("message", (trade_info) => {
    trade_info_json = trade_info;
  });
};

//json 형식으로 웹에 배포
const hosting_start = (): void => {
  let app = express();
  app.use(cors());

  app.get("/webtoon/all", function (request: any, response: { json: (arg0: any[]) => void }) {
    response.json(webtoon_info_json);
  });
  app.get("/insidertrade/list", function (request: any, response: { json: (arg0: any[]) => void }) {
    response.json(trade_info_json);
  });

  app.listen(process.env.PORT || 8080, function () {
    console.log("webtoon api hosting started on port 8080.");
  });
};

//ms단위 s단위로 변환
function sec(time: number) {
  return time * 1000;
}

main();