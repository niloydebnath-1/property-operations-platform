const BASE=process.env.NEXT_PUBLIC_API_URL||"http://localhost:4000/api";
export function token(){if(typeof window==="undefined")return null;return localStorage.getItem("pop_token")}
export async function api(path:string,options:RequestInit={}){const t=token();const res=await fetch(`${BASE}${path}`,{...options,headers:{"Content-Type":"application/json",...(t?{Authorization:`Bearer ${t}`} : {}),...(options.headers||{})},cache:"no-store"});const data=await res.json().catch(()=>({message:"Unexpected server response"}));if(!res.ok)throw new Error(data.message||"Request failed");return data}
