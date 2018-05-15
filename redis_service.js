const RedisIO = require('ioredis');

const redis = new RedisIO();

// (async ()=>{
//   const abc = await redis.get('abc');
//   const hgetall = await redis.hgetall('my_hash_1');
//   const smembers = await redis.smembers('my_set_1');
//   console.log(abc);
//   console.log(new Map(hgetall));
//   console.log(new Set(smembers));
// })().then(r=>{

// }).catch(e=>{

// })

const ACFUN_ID_SET_REDIS_KEY = 'acfun_id_set';
const ACFUN_ACTICLE_GOT_ID_SET = 'acfun_acticle_got_id_set';
const perNum = 10000;
async function generateAcfunIdsToRedis(min,max) {
  for (let i = min; i < max; i++) {
    const arr = new Array(perNum);
    for (let j = 0; j < perNum; j++) {
      arr[j] = i*perNum+j;
    }
    console.log("arr.length",arr.length)
    await redis.sadd(ACFUN_ID_SET_REDIS_KEY,arr).then(r=>{
      console.log(r);
    });
    await redis.scard(ACFUN_ID_SET_REDIS_KEY).then(r=>{
      console.log(r);
    });
  }
}


async function getRandomAcfunIds(count){
  const ids = await redis.spop(ACFUN_ID_SET_REDIS_KEY,count);
  return ids;
}

async function markActicleIdSucceed(id){
  await redis.sadd(ACFUN_ACTICLE_GOT_ID_SET,id);
}

async function idBackInPool(id){
  await redis.sadd(ACFUN_ID_SET_REDIS_KEY,id);
}

async function getRemainingIDCount(params) {
  return await redis.scard(ACFUN_ID_SET_REDIS_KEY).then(r=>Number(r));
}

module.exports = {
  generateAcfunIdsToRedis,
  getRandomAcfunIds,
  markActicleIdSucceed,
  idBackInPool,
  getRemainingIDCount
}