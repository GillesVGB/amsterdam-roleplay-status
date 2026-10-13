import http from 'node:http';

export function requestJsonNative(url,{timeoutMs=4000}={}){
 return new Promise((resolve,reject)=>{
  let connected=false,finished=false,timer;
  const finish=(error,value)=>{if(finished)return;finished=true;clearTimeout(timer);req.destroy();if(error){error.stage=connected?'http-response':'tcp-connect';reject(error);}else resolve(value);};
  const req=http.request(url,{agent:false,headers:{Accept:'application/json','User-Agent':'HeerlenRoleplayStatus/1.0'}},response=>{
   let body='';response.setEncoding('utf8');
   response.on('data',chunk=>{body+=chunk;if(body.length>65536)req.destroy(Object.assign(Error('Response too large'),{code:'BODY_TOO_LARGE'}));});
   response.on('error',error=>finish(error));
   response.on('end',()=>{if(response.statusCode!==200)return finish(Object.assign(Error('HTTP request failed'),{code:'HTTP_'+response.statusCode}));try{finish(null,JSON.parse(body));}catch(error){finish(error);}});
  });
  req.on('socket',socket=>{socket.once('connect',()=>{connected=true;});});
  req.on('error',error=>finish(error));
  timer=setTimeout(()=>req.destroy(Object.assign(Error('Request timed out'),{code:'TIMEOUT'})),timeoutMs);
  // The host stalls requests with an explicit Connection header. Removing it
  // before end() also suppresses Node's default header; finish closes the socket.
  req.removeHeader('Connection');
  req.end();
 });
}
const count=value=>{if(value===null||value===undefined||value==='')return null;const n=Number(value);return Number.isInteger(n)&&n>=0&&n<=10000?n:null;};
// FXServer routes by path prefix. This suffix reaches the same live handler
// when a host filters requests to the bare /dynamic.json path.
const statusUrl='http://31.56.25.179:30120/dynamic.json/status';
export function createFiveMStatusReader({url=statusUrl,fallbackUrl=url===statusUrl?'http://31.56.25.179:30120/dynamic.json':null,requestJson=requestJsonNative,listingFetcher=fetch,cacheMs=10000}={}){
 let cached=null,pending=null;
 async function read(){
  const stamp=new Date().toISOString();
  const base={serverName:'Heerlen Roleplay',source:'FiveM',join:'fivem://connect/31.56.25.179:30120',joinUrl:'fivem://connect/31.56.25.179:30120',online:false,status:'unreachable',players:null,maxPlayers:null,capacity:null,queue:null,maintenance:false,maintenanceText:'',updatedAt:stamp,checkedAt:stamp};
  let listing;
  try{
   let data;
   try{data=await requestJson(url);}catch(error){listing=readListing(listingFetcher).catch(()=>null);if(!fallbackUrl)throw error;data=await requestJson(fallbackUrl);}
   const players=count(data?.clients),capacity=count(data?.sv_maxclients);if(players===null||capacity===null||capacity<1||players>capacity)throw Error('Invalid counts');
   const checkedAt=new Date().toISOString();return {...base,online:true,status:'online',players,maxPlayers:capacity,capacity,approximate:false,updatedAt:checkedAt,checkedAt,message:'De FiveM-server is bereikbaar. Je kunt de stad in.'};
  }
  catch(error){
   const fallback=await (listing||readListing(listingFetcher).catch(()=>null));
   if(fallback)return {...base,error:'FIVEM_UNREACHABLE',lastKnown:{players:fallback.players,capacity:fallback.capacity,reportedAt:fallback.reportedAt,source:fallback.source},message:'De server reageert niet op de statuscontrole. De FiveM-serverlijst bevat alleen een eerdere melding.'};
   console.warn('FiveM status failed',{code:error.code||'INVALID_RESPONSE',stage:error.stage||'validation'});return {...base,error:'FIVEM_UNREACHABLE',message:'De actuele FiveM-status kan tijdelijk niet worden opgehaald.'};
  }
 }
 return async()=>{if(cached&&Date.now()-cached.savedAt<cacheMs)return cached.data;if(pending)return pending;pending=read().then(data=>{cached={savedAt:Date.now(),data};return data;});try{return await pending;}finally{pending=null;}};
}
async function readListing(fetcher){
 const response=await fetcher('https://frontend.cfx-services.net/api/servers/single/y994lqm',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw Error('Listing unavailable');
 const result=await response.json(),data=result.Data;
 if(result.EndPoint!=='y994lqm'||!Array.isArray(data?.connectEndPoints)||!data.connectEndPoints.includes('31.56.25.179:30120'))throw Error('Different server');
 const reportedAt=data.lastSeen,age=Date.now()-Date.parse(reportedAt);
 if(!Number.isFinite(age)||age>600000||age< -60000)throw Error('Listing stale');
 const players=count(data.clients),capacity=count(data.sv_maxclients);
 if(players===null||capacity===null||capacity<1||players>capacity)throw Error('Invalid listing counts');
 return {players,maxPlayers:capacity,capacity,source:'FiveM-serverlijst',reportedAt,approximate:true,message:'Status uit de officiële FiveM-serverlijst. De telling kan enkele minuten achterlopen.'};
}
