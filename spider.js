const RedisService = require('./redis_service');
const Spider = require('./spider_function');

//ids [ '2795637', '3176474', '2163275' ]
(async () => {
  switch (process.argv[2]) {
    case "generate_ids":
      await RedisService.generateAcfunIdsToRedis(Number(process.argv[3]), Number(process.argv[4]))
        .then(r => {
          console.log('done');
          process.exit(0);
        }).catch(e => {
          console.log(e);
          process.exit(1);
        });
      break;
    case "start_getting_articles":
      //await Spider.spideringArticle(Number(process.argv[3]))
      await getArticlesBG()
        .then(r => {
          console.log('done');
          process.exit(0);
        }).catch(e => {
          console.log("xxxx")
          console.log(e);
          process.exit(1);
        });
      break;
    case "get_single_actical":
      await Spider.getSingleActical(Number(process.argv[3]))
        .then(r => {
          console.log('done');
          process.exit(0);
        }).catch(e => {
          console.log("xxxx")
          console.log(e);
          process.exit(1);
        });
      break;
    default:
      break;
  }

  // process.on('unhandledRejection', error => {
  //   // Will print "unhandledRejection err is not defined"
  //   console.log('unhandledRejection', error.message);
  // });
})().then(() => {

})

async function getArticlesBG() {
  let remainCount = await RedisService.getRemainingIDCount();
  const numbersPerTime = 5;
  while (remainCount >= 5) {
    await Spider.spideringArticle(numbersPerTime).then(r => {
      console.log(r);
    }).catch(e => {
      console.log(e);
    })
    remainCount = await RedisService.getRemainingIDCount();
  }
}