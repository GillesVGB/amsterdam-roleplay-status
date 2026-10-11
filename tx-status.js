const count=value=>{if(value===null||value===undefined||value==='')return null;const n=Number(value);return Number.isInteger(n)&&n>=0&&n<=10000?n:null;};
export function createTxStatusReader({url='http://31.56.25.179:40120/host/status',token='',fetcher=fetch,timeoutMs=6000}={}){
 let pending=null;
 async function read(){
  const updatedAt=new Date().toISOString();
  const base={serverName:'Heerlen Roleplay',source:'txAdmin',join:'fivem://connect/31.56.25.179:30120',joinUrl:'fivem://connect/31.56.25.179:30120',online:false,status:'unknown',players:null,maxPlayers:null,capacity:null,queue:null,maintenance:false,maintenanceText:'',updatedAt,checkedAt:updatedAt};
  try{
   const endpoint=new URL(url);if(!['http:','https:'].includes(endpoint.protocol)||endpoint.username||endpoint.password)throw Error('Invalid endpoint');
   const headers={Accept:'application/json'};if(token)headers['x-txadmin-envtoken']=token;
   const response=await fetcher(endpoint.href,{headers,cache:'no-store',signal:AbortSignal.timeout(timeoutMs)});if(!response.ok)throw Error('HTTP request failed');
   const data=await response.json();
   if(data.error){const unavailable=data.error==='token not configured';return {...base,error:unavailable?'TXADMIN_NOT_CONFIGURED':'TXADMIN_AUTH_REQUIRED',message:unavailable?'De txAdmin-status-API is nog niet ingeschakeld.':'De txAdmin-statuskoppeling moet worden ingesteld.'};}
   if(data.isConfigured!==true||!['ONLINE','OFFLINE','PARTIAL'].includes(data.status))throw Error('Invalid txAdmin response');
   const players=count(data.playerCount),capacity=count(data.playerSlots);
   if(data.status==='ONLINE'){if(players===null||capacity===null||capacity<1||players>capacity)throw Error('Invalid player counts');return {...base,online:true,status:'online',players,maxPlayers:capacity,capacity};}
   return {...base,status:data.status==='OFFLINE'?'offline':'unknown',message:data.status==='OFFLINE'?'txAdmin meldt dat de FiveM-server offline is.':'txAdmin meldt dat de FiveM-server niet volledig bereikbaar is.'};
  }catch{return {...base,status:'unreachable',error:'TXADMIN_UNREACHABLE',message:'De actuele txAdmin-status kan tijdelijk niet worden opgehaald.'};}
 }
 return async()=>{if(pending)return pending;pending=read();try{return await pending;}finally{pending=null;}};
}
