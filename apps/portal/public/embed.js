"use strict";(()=>{var A={fontSize:16,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:4,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:28,titleWeight:"normal",titleAlign:"left",labelSize:18,labelWeight:"normal"},H=new Set;function T(r,e){if(!r)return e;let n=r.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:e:e}function re(r){if(!r)return{};let{headingFont:e,...n}=r;return e?{titleFont:e,labelFont:e,...n}:n}function ie(r,e){return{...A,...re(r),...re(e)}}function Ne(r){let e=/^#?([0-9a-f]{6})$/i.exec(r.trim());if(!e)return null;let n=parseInt(e[1],16);return[n>>16&255,n>>8&255,n&255]}function Le(r,e,n){let[t,o,a]=[r,e,n].map(c=>{let i=c/255;return i<=.03928?i/12.92:Math.pow((i+.055)/1.055,2.4)});return .2126*t+.7152*o+.0722*a}function ae(r){let e=Ne(r);return e?Le(...e):null}function ke(r,e){let n=ae(r);if(n===null||n<=.179)return"#ffffff";let t=ae(e);return t!==null&&(n+.05)/(t+.05)>=4.5?e:A.text}function se(r,e){var d,p,l,m,f,y;let n=oe(e.bodyFont,e.fontFamily);r.style.setProperty("--canopy-font",n);for(let[s,u]of[["--canopy-title-font",e.titleFont],["--canopy-label-font",e.labelFont]]){let b=oe(u);r.style.setProperty(s,b==="inherit"?"var(--canopy-font)":b)}r.style.setProperty("--canopy-font-size",`${(d=e.fontSize)!=null?d:A.fontSize}px`);let t=T(e.text,A.text);r.style.setProperty("--canopy-text",t),r.style.setProperty("--canopy-bg",T(e.background,A.background)),r.style.setProperty("--canopy-field-bg",T(e.fieldBackground,A.fieldBackground));let o=T(e.primary,A.primary);r.style.setProperty("--canopy-primary",o),r.style.setProperty("--canopy-button-text",T(e.buttonTextColor,"")||ke(o,t)),r.style.setProperty("--canopy-border",T(e.border,A.border)),r.style.setProperty("--canopy-radius",`${(p=e.radius)!=null?p:A.radius}px`),r.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),r.style.setProperty("--canopy-button-align",e.buttonAlign||A.buttonAlign);let a={sm:"1.25em",md:"1.5em",lg:"1.875em",xl:"2.25em"},c=(s,u)=>{var x;let b=Number(s);return b>0?`${b}px`:(x=a[String(s)])!=null?x:`${Number(u)}px`};r.style.setProperty("--canopy-title-size",c(e.titleSize,A.titleSize)),r.style.setProperty("--canopy-label-size",c(e.labelSize,A.labelSize));let i={light:"300",normal:"400",medium:"500",bold:"700",semibold:"700"};r.style.setProperty("--canopy-title-weight",(m=i[(l=e.titleWeight)!=null?l:"normal"])!=null?m:"400"),r.style.setProperty("--canopy-label-weight",(y=i[(f=e.labelWeight)!=null?f:"normal"])!=null?y:"400");for(let[s,u]of[["--canopy-title-color",e.titleColor],["--canopy-label-color",e.labelColor]]){let b=u?T(u,""):"";b?r.style.setProperty(s,b):r.style.removeProperty(s)}r.style.setProperty("--canopy-title-align",e.titleAlign==="center"?"center":"left")}function le(r){switch(r.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function oe(r,e){return r&&r!=="inherit"?`'${r}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function ce(r,e){let n=r.filter(c=>!!c&&c!=="inherit"&&!H.has(c));if(n.length===0)return;let t=n.map(c=>`family=${encodeURIComponent(c)}`).join("&"),o=`${e}/api/fonts?${t}`,a=document.createElement("link");a.rel="stylesheet",a.href=o,a.dataset.canopyFont="true",document.head.appendChild(a),n.forEach(c=>H.add(c))}function pe(r){if(!r||H.has(r))return;let e=document.createElement("link");e.rel="stylesheet",e.href=r,e.dataset.canopyFont="true",document.head.appendChild(e),H.add(r)}var G="Name",$e={first:"First",middle:"Middle",middleInitial:"M.I.",last:"Last",single:G},S=["first","last"],de=["first","middle","middleInitial","last","single"];function ue(r){return[...r].sort((e,n)=>de.indexOf(e)-de.indexOf(n))}function D(r,e){var t;if(r!=null&&r.requiredParts)return r.requiredParts;let n=(t=r==null?void 0:r.parts)!=null?t:S;return e?n.filter(o=>o!=="middle"&&o!=="middleInitial"):[]}function R(r){return r==="middleInitial"?2:100}function q(r,e){return(e==null?void 0:e[r])||$e[r]||r}var Se={line1:"Street",line2:"Apt, suite",city:"City",region:"State",postalCode:"ZIP"},me=["line1","line2","city","region","postalCode"];function L(r){var n;let e=(n=r==null?void 0:r.parts)!=null?n:me;return me.filter(t=>e.includes(t))}function w(r,e){return(e==null?void 0:e[r])||Se[r]||r}function K(r,e){return r!=null&&r.requiredParts?r.requiredParts:e?L(r).filter(n=>n!=="line2"):[]}var _=200,Pe=/^\d{5}(-\d{4})?$/;function ye(r,e,n){let t=L(e),o=K(e,n),a=i=>{var d;return String((d=r==null?void 0:r[i])!=null?d:"")},c=i=>a(i).trim();for(let i of t){if(o.includes(i)&&!c(i))return`${w(i,e==null?void 0:e.partLabels)} is required.`;if(a(i).length>_)return`${w(i,e==null?void 0:e.partLabels)} must be ${_} characters or fewer.`}return t.includes("postalCode")&&c("postalCode")&&!Pe.test(c("postalCode"))?`${w("postalCode",e==null?void 0:e.partLabels)} must be a US ZIP code, like 12345 or 12345-6789.`:null}var Z="Choose one...",z="Other",k="__other__";function B(r){let e=Array.isArray(r)?r:r==null?void 0:r.options;return Array.isArray(e)?e.filter(n=>typeof n=="object"&&n!==null&&typeof n.value=="string"):[]}function W(r){return!Array.isArray(r)&&(r==null?void 0:r.allowOther)===!0}function Y(r,e,n,t){let o=r==="CHECKBOXES"?e:typeof e=="string"?[e]:null;if(!Array.isArray(o)||o.some(i=>typeof i!="string"))return`${t} must be one of its options.`;if(new Set(o).size<o.length)return`${t} picks an option more than once.`;let a=B(n).map(i=>i.value),c=o.filter(i=>!a.includes(i));return c.length===0?null:!W(n)||c.length>1?`${t} must be one of its options.`:c[0].length>200?`${t} must be 200 characters or fewer.`:null}var Oe="Ext.";function V(r){let e=r==null?void 0:r.parts;return Array.isArray(e)&&e.includes("extension")?["number","extension"]:["number"]}function P(r){var e;return((e=r==null?void 0:r.partLabels)==null?void 0:e.extension)||Oe}function J(r){let e=r.trim().replace(/[\s().-]/g,"");if(!/^\+?\d+$/.test(e))return null;let n=e.replace("+","");if(e.startsWith("+")&&!n.startsWith("1"))return n.length>=7&&n.length<=15?`+${n}`:null;let t=n.length===11&&n.startsWith("1")?n.slice(1):n;return t.length===10?`+1${t}`:null}var Q=30,Ie=/^\d{1,10}$/,he=10;function fe(r,e,n,t){var c,i,d,p;let o=(i=(c=r==null?void 0:r.number)==null?void 0:c.trim())!=null?i:"",a=(p=(d=r==null?void 0:r.extension)==null?void 0:d.trim())!=null?p:"";return o?o.length>Q||!J(o)?`${t} must be a phone number, like (201) 555-0123 or +44 20 7946 0958.`:a&&!Ie.test(a)?`${P(e)} must be a number, like 45.`:null:a?`${t} must include a phone number.`:n?`${t} is required.`:null}var U={TEXT:200,EMAIL:254,TEXTAREA:1e4,NUMBER:50,DATE:30,DATE_OF_BIRTH:10,WEBSITE:2e3};function ge(r){return typeof r.validation=="object"&&r.validation!==null?r.validation:{}}function X(r){if(r.type!=="TEXTAREA")return;let e=ge(r).maxLength;return Number.isInteger(e)&&e>=1&&e<=U.TEXTAREA?e:void 0}var j=r=>`${r.toLocaleString("en-US")} character${r===1?"":"s"}`,Me=/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;function Fe(r){return r.length>320||/[\r\n]/.test(r)?!1:Me.test(r)}var He=new Set(["gmail.com","googlemail.com","yahoo.com","yahoo.co.uk","ymail.com","rocketmail.com","hotmail.com","hotmail.co.uk","outlook.com","live.com","msn.com","aol.com","icloud.com","me.com","mac.com","proton.me","protonmail.com","pm.me","gmx.com","gmx.net","mail.com","zoho.com","yandex.com","fastmail.com","hey.com","tutanota.com","comcast.net","verizon.net","att.net","sbcglobal.net","bellsouth.net","cox.net","charter.net","earthlink.net","juno.com","optonline.net","frontier.com","centurylink.net","qq.com","163.com","naver.com","web.de","orange.fr","free.fr","libero.it","mail.ru"]);function O(r=new Date){let e=(n,t=2)=>String(n).padStart(t,"0");return`${e(r.getFullYear(),4)}-${e(r.getMonth()+1)}-${e(r.getDate())}`}function xe(){let r=O();return{earliest:r,latest:r}}function Ee(r){if(/^\d{4}-\d{2}-\d{2}$/.test(r)){let n=new Date(`${r}T00:00:00Z`);return!isNaN(n.getTime())&&n.toISOString().slice(0,10)===r?r:null}let e=new Date(r);return isNaN(e.getTime())?null:O(e)}function De(r){let e=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(r);return e?Ee(`${e[1]}-${e[2].padStart(2,"0")}-${e[3].padStart(2,"0")}`):null}function Re(r){let e=String(r).replace(/[,\s]/g,"");return/^-?(\d+\.?\d*|\.\d+)$/.test(e)?e:null}function qe(r){let e=r.trim();if(/\s/.test(e))return null;let n=/^https?:\/\//i.test(e)?e:`https://${e}`;try{let t=new URL(n),o=t.hostname.split(".");return o.length>1&&o.every(Boolean)&&!t.username&&!t.password?n:null}catch(t){return null}}function be(r,e,n){return e!==void 0&&r.length>e?`${n} must be ${j(e)} or fewer.`:null}function ee(r,e,n,t){if(r==null)return null;if(typeof r!="object"||Array.isArray(r))return`${t} must be an object of its parts.`;for(let[o,a]of Object.entries(r)){if(!e.includes(o))return`${t} has no part "${o}".`;if(typeof a!="string")return`${n(o)} must be text.`}return null}function _e(r,e,n=xe()){var i,d,p;let t=r.label||r.name,o=ge(r);switch(r.type){case"CHECKBOX":return e!=null&&typeof e!="boolean"&&e!=="on"?`${t} must be true or false.`:r.required&&!e?`${t} is required.`:null;case"CHECKBOXES":if(!Array.isArray(e)||e.length===0){if(r.required)return`${t} is required.`;if(e==null||Array.isArray(e))return null}return Y("CHECKBOXES",e,r.options,t);case"NAME":{let l=typeof r.options=="object"&&r.options!==null?r.options:{},m=l.parts||S,f=b=>b==="single"?t:q(b,l.partLabels),y=ee(e,m,f,t);if(y)return y;let s=e,u=D(l,r.required);for(let b of m){let x=s==null?void 0:s[b],h=f(b);if(u.includes(b)&&(!x||String(x).trim()===""))return`${h} is required.`;let E=be(String(x!=null?x:""),R(b),h);if(E)return E}return null}case"PHONE":{let l=m=>m==="extension"?P(r.validation):t;return(i=ee(e,V(r.validation),l,t))!=null?i:fe(e,r.validation,r.required,t)}case"ADDRESS":{let l=r.options,m=f=>w(f,l==null?void 0:l.partLabels);return(d=ee(e,L(l),m,t))!=null?d:ye(e,l,r.required)}}if(e==null)return r.required?`${t} is required.`:null;if(typeof e!="string"&&!(r.type==="NUMBER"&&typeof e=="number"))return r.type==="NUMBER"?`${t} must be a number.`:`${t} must be text.`;let a=String(e);if(a.trim()==="")return r.required?`${t} is required.`:null;let c=be(a,(p=X(r))!=null?p:U[r.type],t);if(c)return c;switch(r.type){case"DROPDOWN":return Y("DROPDOWN",e,r.options,t);case"DATE":{let l=Ee(a);return l?o.minDate==="today"&&l<n.earliest?`${t} must be today or in the future.`:o.maxDate==="today"&&l>n.latest?`${t} must be today or in the past.`:null:`${t} must be a real date.`}case"DATE_OF_BIRTH":{let[l="",m="",f=""]=a.split("-");if(!m.trim())return`${t} must include a month.`;if(!f.trim())return`${t} must include a day.`;if(!l.trim())return`${t} must include a year.`;if(!/^\d{4}$/.test(l))return"Year must include 4 numbers.";let y=De(a);return y?y>=n.latest?`${t} must be in the past.`:null:`${t} must be a real date.`}case"NUMBER":{let{min:l,max:m,integer:f}=o,y=Math.min(Math.max(10,l!=null?l:-1/0),m!=null?m:1/0),s=Re(e);if(s===null)return`${t} must be a ${f?"whole ":""}number, like ${y}.`;let u=Number(s);return f&&!Number.isInteger(u)?`${t} must be a whole number, like ${y}.`:l!==void 0&&u<l||m!==void 0&&u>m?l!==void 0&&m!==void 0?`${t} must be between ${l} and ${m}.`:l!==void 0?`${t} must be ${l} or more.`:`${t} must be ${m} or ${f?"fewer":"less"}.`:null}case"WEBSITE":return qe(a)?null:`${t} must be a web address, like example.com.`;case"EMAIL":{let l=a.trim();if(!Fe(l))return`${t} must be an email address, like name@example.com.`;let m=l.slice(l.lastIndexOf("@")+1).toLowerCase();return o.workOnly===!0&&He.has(m)?`${t} must be a work email address, not a personal one like Gmail.`:null}default:return null}}function ve(r,e,n=xe()){let t={};for(let o of r){let a=_e(o,ze(e,o.name),n);a&&(t[o.name]=a)}return t}function ze(r,e){return Object.prototype.hasOwnProperty.call(r,e)?r[e]:void 0}var Ae=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var We={single:"name",first:"given-name",middle:"additional-name",last:"family-name"},Ve={line1:"address-line1",line2:"address-line2",city:"address-level2",region:"address-level1",postalCode:"postal-code"},Ue=[["month","Month",2,"bday-month"],["day","Day",2,"bday-day"],["year","Year",4,"bday-year"]],Xe=r=>{let[e,n,t]=r.map(a=>a.value.trim());if(!e&&!n&&!t)return"";let o=a=>/^\d$/.test(a)?`0${a}`:a;return`${t}-${o(e)}-${o(n)}`},C=(r,e,n,t)=>r.setAttribute("aria-describedby",[e,t,n].flatMap(o=>o?[o.id]:[]).join(" ")),je="feedback@canopyds.com",Ge=0,I=class extends Error{constructor(e){super(e),this.name="InactiveFormError"}},M=class extends Error{constructor(e){super(e),this.name="HostedOnlyFormError"}},F=class{constructor(e,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.formEl=null;this.submitButton=null;this.instanceId=`canopy-${Ge++}`;this.container=e,this.options=n}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){if(console.error(e),e instanceof I){this.renderInactive();return}if(e instanceof M){this.renderHostedOnly();return}this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var o;let e=this.options.baseUrl||"",n=this.options.formId||((o=this.formDefinition)==null?void 0:o.formId);if(!n)throw new Error("Form configuration error: no formId");let t=await fetch(`${e}/api/embed/${n}`,{method:"GET",credentials:"omit"});if(!t.ok){if(t.status===403)try{let a=await t.json();if((a==null?void 0:a.code)==="FORM_INACTIVE")throw new I(a.error||"Form is inactive");if((a==null?void 0:a.code)==="FORM_HOSTED_ONLY")throw new M(a.error||"Form is only available at its hosted URL")}catch(a){if(a instanceof I||a instanceof M)throw a}throw new Error("Failed to load form definition")}return t.json()}renderFromDefinition(e){this.container.classList.add("canopy-root"),this.formDefinition=e,this.render(e)}render(e){this.container.innerHTML="",this.fieldElements.clear();let n=ie(e.defaultTheme,this.options.themeOverrides);se(this.container,n),ce([n.bodyFont,n.titleFont,n.labelFont],this.options.baseUrl||""),!n.bodyFont&&!n.titleFont&&!n.labelFont&&pe(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(le(n));let t=e.fields&&e.fields.length>0,o=e.title||e.description;if(!t&&!o){this.renderSkeleton();return}if(e.title||e.description){let s=document.createElement("div");if(s.className="canopy-header",e.title){let u=document.createElement("h2");u.className="canopy-title",u.textContent=e.title,s.appendChild(u)}if(e.description){let u=document.createElement("p");u.className="canopy-description",u.textContent=e.description,s.appendChild(u)}this.container.appendChild(s)}let a=document.createElement("div");a.className="canopy-status",a.setAttribute("role","alert"),a.setAttribute("aria-live","assertive"),this.statusEl=a;let c=document.createElement("form");c.className="canopy-form",c.addEventListener("submit",s=>this.handleSubmit(s)),this.formEl=c,e.fields.forEach(s=>{let{wrapper:u,input:b,errorEl:x}=this.createField(s);u&&(u.dataset.fieldName=s.name,c.appendChild(u)),this.fieldElements.set(s.name,{input:b,errorEl:x})}),this.options.preview&&(c.setAttribute("autocomplete","off"),c.querySelectorAll("input, select, textarea").forEach(s=>s.setAttribute("autocomplete","off")));let i=document.createElement("button");i.type="submit",i.className="canopy-submit",i.textContent=n.buttonText||"Submit",this.options.preview&&(i.classList.add("canopy-submit-preview"),i.setAttribute("data-preview-tooltip","For preview only. No submission will be created"));let d=getComputedStyle(this.container),p=d.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",l=d.getPropertyValue("--canopy-button-text").trim()||"#ffffff",m=d.getPropertyValue("--canopy-radius").trim()||"8px",f=d.getPropertyValue("--canopy-button-width").trim()||"100%";i.style.cssText=`
      display: block !important;
      width: ${f} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${m} !important;
      padding: 10px 16px !important;
      font-family: var(--canopy-font, inherit) !important;
      font-size: var(--canopy-font-size, 16px) !important;
      font-weight: 600 !important;
      background: ${p} !important;
      background-color: ${p} !important;
      color: ${l} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=i;let y=document.createElement("div");y.className="canopy-form-actions",y.appendChild(i),c.appendChild(y),this.container.appendChild(a),this.container.appendChild(c),this.container.appendChild(this.renderWatermark(e))}renderWatermark(e){let n=document.createElement("div");n.className="canopy-watermark";let t=document.createElement("span");t.className="canopy-watermark-brand",t.textContent="Powered by Canopy Forms (Beta)",n.appendChild(t);let o=document.createElement("span");o.className="canopy-watermark-sep",o.setAttribute("aria-hidden","true"),o.textContent="\xB7",n.appendChild(o);let a=(e==null?void 0:e.title)||(e==null?void 0:e.name)||(e==null?void 0:e.formId)||"unknown form",c=(e==null?void 0:e.formId)||"unknown",i=`Canopy Forms issue \u2014 ${a}`,d=[`Form: ${a}`,`Form ID: ${c}`,"","Describe the issue:",""].join(`
`),p=`mailto:${je}?subject=${encodeURIComponent(i)}&body=${encodeURIComponent(d)}`,l=document.createElement("a");return l.className="canopy-watermark-link",l.href=p,l.textContent="Report an issue",l.rel="noopener",n.appendChild(l),n}createField(e){var m,f,y;let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field";let o=document.createElement("label");if(o.className="canopy-label",o.dataset.fieldPart="label",o.htmlFor=n,o.textContent=e.label||e.name,e.required){let s=document.createElement("span");s.className="canopy-required",s.textContent=" *",s.setAttribute("aria-hidden","true"),o.appendChild(s)}let a;switch(e.type){case"TEXTAREA":{let s=document.createElement("textarea");s.className="canopy-textarea";let u=X(e);s.rows=u?Math.min(Math.max(Math.ceil(u/60),4),15):5,a=s;break}case"DROPDOWN":{let s=B(e.options),u=Array.isArray(e.options)||(m=e.options)==null?void 0:m.defaultValue,b=s.some(g=>g.value===u),x=W(e.options),h=document.createElement("select");h.className="canopy-select";let E=document.createElement("option");if(E.value="",E.textContent=Z,E.disabled=!0,E.selected=!b,h.appendChild(E),s.forEach(g=>{let v=document.createElement("option");v.value=g.value,v.textContent=g.label,b&&g.value===u&&(v.selected=!0),h.appendChild(v)}),x){let g=document.createElement("option");g.value=k,g.textContent=z,h.appendChild(g)}if(a=h,x){let g=this.createOtherInput(e);h.addEventListener("change",()=>{h.value===k?(g.style.setProperty("display","block","important"),e.required&&(g.required=!0)):(g.style.setProperty("display","none","important"),g.required=!1,g.value="")}),h.__otherInput=g}break}case"CHECKBOX":{let s=document.createElement("label");s.className="canopy-checkbox";let u=document.createElement("input");u.type="checkbox",u.id=n,u.name=e.name,e.required&&u.setAttribute("aria-required","true"),u.addEventListener("change",()=>{u.setCustomValidity("")}),s.appendChild(u);let b=document.createElement("span");b.dataset.fieldPart="label",b.textContent=e.label||e.name,s.appendChild(b),t.appendChild(s);let x=this.createHelpText(e,n);x&&t.appendChild(x);let h=document.createElement("span");return h.className="canopy-error",h.id=`${n}-error`,t.appendChild(h),C(u,x,h),u.setAttribute("aria-invalid","false"),{wrapper:t,input:u,errorEl:h}}case"CHECKBOXES":{let s=document.createElement("div");s.className="canopy-checkboxes",s.setAttribute("data-checkbox-group",e.name);let u=()=>{let g=s.querySelector("input[type=checkbox]");g&&g.setCustomValidity("")},b=(g,v,we)=>{let $=document.createElement("label");$.className="canopy-checkbox",$.dataset.fieldPart=we;let N=document.createElement("input");N.type="checkbox",N.name=e.name,N.value=g,N.addEventListener("change",u);let ne=document.createElement("span");return ne.textContent=v,$.appendChild(N),$.appendChild(ne),s.appendChild($),N};if(B(e.options).forEach((g,v)=>{b(g.value,g.label,`option-${v}`)}),W(e.options)){let g=b(k,z,"option-other"),v=this.createOtherInput(e);v.dataset.choiceOther=e.name,v.addEventListener("input",u),g.addEventListener("change",()=>{g.checked?(v.style.setProperty("display","block","important"),v.focus()):(v.style.setProperty("display","none","important"),v.value="")}),s.appendChild(v)}let x=document.createElement("input");x.type="hidden",x.id=n,x.name=e.name,o.id=`${n}-label`,s.setAttribute("role","group"),s.setAttribute("aria-labelledby",o.id);let h=this.createHelpText(e,n);t.appendChild(o),h&&t.appendChild(h),t.appendChild(s);let E=document.createElement("span");return E.className="canopy-error",E.id=`${n}-error`,t.appendChild(E),C(s,h,E),x.setAttribute("aria-invalid","false"),{wrapper:t,input:x,errorEl:E}}case"EMAIL":{let s=document.createElement("input");s.type="text",s.className="canopy-input",s.setAttribute("inputmode","email"),s.setAttribute("autocomplete","email"),s.setAttribute("autocapitalize","none"),s.setAttribute("autocorrect","off"),s.spellcheck=!1,a=s;break}case"WEBSITE":{let s=document.createElement("input");s.type="text",s.className="canopy-input",s.setAttribute("inputmode","url"),s.setAttribute("autocomplete","url"),s.setAttribute("autocapitalize","none"),s.setAttribute("autocorrect","off"),s.spellcheck=!1,a=s;break}case"DATE":{let s=document.createElement("input");s.type="date",s.className="canopy-input",((f=e.validation)==null?void 0:f.minDate)==="today"&&(s.min=O()),((y=e.validation)==null?void 0:y.maxDate)==="today"&&(s.max=O()),a=s;break}case"NUMBER":{let s=document.createElement("input");s.type="text",s.className="canopy-input",s.spellcheck=!1;let u=e.validation;(u==null?void 0:u.min)!==void 0&&u.min<0||s.setAttribute("inputmode",u!=null&&u.integer?"numeric":"decimal"),a=s;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);case"DATE_OF_BIRTH":return this.createDateOfBirthField(e);case"PHONE":return this.createPhoneField(e);default:{let s=document.createElement("input");s.type="text",s.className="canopy-input",a=s}}a.id=n,a.name=e.name,a.dataset.fieldPart="input",a.setAttribute("aria-invalid","false"),e.required&&a.setAttribute("aria-required","true");let c=U[e.type];c&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=c),a.addEventListener("input",()=>{a.setCustomValidity("")});let i=document.createElement("span");i.className="canopy-error",i.id=`${n}-error`;let d=this.createHelpText(e,n);t.appendChild(o),d&&t.appendChild(d),t.appendChild(a);let p=X(e),l=p&&a instanceof HTMLTextAreaElement?this.addCharacterCount(t,a,p,n):void 0;return C(a,d,i,l),a.__otherInput&&t.appendChild(a.__otherInput),t.appendChild(i),{wrapper:t,input:a,errorEl:i}}createHelpText(e,n){if(!e.helpText)return null;let t=document.createElement("p");return t.className="canopy-help-text",t.id=`${n}-help`,t.textContent=e.helpText,t}addCharacterCount(e,n,t,o){let a=document.createElement("p");a.className="canopy-visually-hidden",a.id=`${o}-limit`,a.textContent=`You can enter up to ${j(t)}`;let c=document.createElement("p");c.className="canopy-count",c.setAttribute("aria-hidden","true");let i=document.createElement("p");i.className="canopy-visually-hidden",i.setAttribute("aria-live","polite");let d=()=>{let l=t-n.value.length;c.textContent=`You have ${j(Math.abs(l))} ${l<0?"too many":"remaining"}`,c.toggleAttribute("data-over",l<0)},p;return n.addEventListener("input",()=>{d(),clearTimeout(p),p=setTimeout(()=>i.textContent=c.textContent,1e3)}),d(),e.append(a,c,i),a}createOtherInput(e){let n=document.createElement("input");return n.type="text",n.className="canopy-input canopy-choice-other",n.name=`${e.name}_other`,n.placeholder="Please specify...",n.maxLength=200,n.setAttribute("aria-label",`${e.label||e.name}: ${z}`),n.style.setProperty("display","none","important"),n.addEventListener("input",()=>{n.setCustomValidity("")}),n}createNameField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-name-group",t.setAttribute("role","group");let o=e.options||{},a=ue(o.parts||S),c=D(o,e.required),i=e.label||G,d=a.includes("single"),p=this.createHelpText(e,n);if(d)t.setAttribute("aria-label",i);else{let y=document.createElement("span");y.id=`${n}-group-label`,y.className="canopy-label",y.dataset.fieldPart="label",y.textContent=i,t.appendChild(y),p&&t.appendChild(p),t.setAttribute("aria-labelledby",y.id)}let l=document.createElement("div");l.className="canopy-name-parts";let m=document.createElement("input");m.type="hidden",m.id=n,m.name=e.name;let f=document.createElement("span");return f.className="canopy-error",f.id=`${n}-error`,a.forEach(y=>{let s=document.createElement("div");s.className=y==="middleInitial"?"canopy-name-part canopy-name-part-initial":"canopy-name-part";let u=document.createElement("label");u.className=d?"canopy-label":"canopy-name-part-label";let b=`${n}-${y}`;u.htmlFor=b,u.textContent=d?i:q(y,o.partLabels),u.dataset.fieldPart=d?"label":`label-${y}`;let x=c.includes(y);if(x){let g=document.createElement("span");g.className="canopy-required",g.textContent=" *",g.setAttribute("aria-hidden","true"),u.appendChild(g)}let h=document.createElement("input");h.type="text",h.className="canopy-input",h.id=b,h.name=`${e.name}.${y}`,h.setAttribute("data-name-part",y),h.setAttribute("data-name-field",e.name),h.maxLength=R(y);let E=We[y];E&&h.setAttribute("autocomplete",E),x&&h.setAttribute("aria-required","true"),h.addEventListener("input",()=>{l.querySelectorAll("input[data-name-part]").forEach(g=>g.setCustomValidity(""))}),s.appendChild(u),d&&p&&s.appendChild(p),s.appendChild(h),l.appendChild(s)}),t.appendChild(l),C(t,p,f),t.appendChild(f),{wrapper:t,input:m,errorEl:f}}createAddressField(e){let n=`${this.instanceId}-${e.name}`,t=e.options||{},o=document.createElement("div");o.className="canopy-field canopy-address-group",o.setAttribute("role","group"),o.setAttribute("aria-labelledby",`${n}-group-label`);let a=document.createElement("span");a.id=`${n}-group-label`,a.className="canopy-label",a.dataset.fieldPart="label",a.textContent=e.label||"Address",o.appendChild(a);let c=this.createHelpText(e,n);c&&o.appendChild(c);let i=document.createElement("div");i.className="canopy-address-parts";let d=document.createElement("input");d.type="hidden",d.id=n,d.name=e.name;let p=document.createElement("span");p.className="canopy-error",p.id=`${n}-error`;let l={postalCode:{maxlength:"10",inputmode:"numeric"}},m=K(t,e.required);return L(t).forEach(f=>{let y=m.includes(f),s=document.createElement("div");s.className=`canopy-address-part canopy-address-part-${f}`;let u=document.createElement("label");u.className="canopy-address-part-label";let b=`${n}-${f}`;if(u.htmlFor=b,u.textContent=w(f,t.partLabels),u.dataset.fieldPart=`label-${f}`,y){let h=document.createElement("span");h.className="canopy-required",h.textContent=" *",h.setAttribute("aria-hidden","true"),u.appendChild(h)}let x;if(f==="region"){let h=document.createElement("select");h.className="canopy-select";let E=document.createElement("option");E.value="",E.textContent=Z,h.appendChild(E),Ae.forEach(g=>{let v=document.createElement("option");v.value=g.value,v.textContent=g.label,h.appendChild(v)}),h.addEventListener("change",()=>{i.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(g=>g.setCustomValidity(""))}),x=h}else{let h=document.createElement("input");h.type="text",h.className="canopy-input",h.maxLength=_,l[f]&&Object.entries(l[f]).forEach(([E,g])=>h.setAttribute(E,g)),h.addEventListener("input",()=>{i.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(E=>E.setCustomValidity(""))}),x=h}x.id=b,x.setAttribute("autocomplete",Ve[f]),x.setAttribute("data-address-part",f),x.setAttribute("data-address-field",e.name),y&&x.setAttribute("aria-required","true"),s.appendChild(u),s.appendChild(x),i.appendChild(s)}),o.appendChild(i),C(o,c,p),o.appendChild(p),{wrapper:o,input:d,errorEl:p}}createDateOfBirthField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-dob-group",t.setAttribute("role","group");let o=document.createElement("span");if(o.id=`${n}-group-label`,o.className="canopy-label",o.dataset.fieldPart="label",o.textContent=e.label||e.name,e.required){let p=document.createElement("span");p.className="canopy-required",p.textContent=" *",p.setAttribute("aria-hidden","true"),o.appendChild(p)}t.appendChild(o),t.setAttribute("aria-labelledby",o.id);let a=this.createHelpText(e,n);a&&t.appendChild(a);let c=document.createElement("div");c.className="canopy-dob-parts";let i=document.createElement("input");i.type="hidden",i.id=n,i.name=e.name;let d=document.createElement("span");return d.className="canopy-error",d.id=`${n}-error`,Ue.forEach(([p,l,m,f])=>{let y=document.createElement("div");y.className=`canopy-dob-part canopy-dob-part-${p}`;let s=`${n}-${p}`,u=document.createElement("label");u.className="canopy-dob-part-label",u.htmlFor=s,u.textContent=l;let b=document.createElement("input");b.type="text",b.className="canopy-input",b.id=s,b.name=`${e.name}.${p}`,b.maxLength=m,b.setAttribute("inputmode","numeric"),b.setAttribute("autocomplete",f),b.setAttribute("data-dob-part",p),b.setAttribute("data-dob-field",e.name),e.required&&b.setAttribute("aria-required","true"),b.addEventListener("input",()=>this.partsOf(e.name).forEach(x=>x.setCustomValidity(""))),y.appendChild(u),y.appendChild(b),c.appendChild(y)}),t.appendChild(c),C(t,a,d),t.appendChild(d),{wrapper:t,input:i,errorEl:d}}createPhoneField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field";let o=document.createElement("label");if(o.className="canopy-label",o.dataset.fieldPart="label",o.htmlFor=`${n}-number`,o.textContent=e.label||e.name,e.required){let m=document.createElement("span");m.className="canopy-required",m.textContent=" *",m.setAttribute("aria-hidden","true"),o.appendChild(m)}t.appendChild(o);let a=this.createHelpText(e,n);a&&t.appendChild(a);let c=document.createElement("input");c.type="hidden",c.id=n,c.name=e.name;let i=document.createElement("span");i.className="canopy-error",i.id=`${n}-error`;let d=document.createElement("div");d.className="canopy-phone-parts";let p=m=>{let f=document.createElement("input");return f.className="canopy-input",f.id=`${n}-${m}`,f.name=`${e.name}.${m}`,f.setAttribute("data-phone-field",e.name),f.setAttribute("data-phone-part",m),f.addEventListener("input",()=>this.partsOf(e.name).forEach(y=>y.setCustomValidity(""))),f},l=p("number");if(l.type="tel",l.maxLength=Q,l.setAttribute("autocomplete","tel"),l.dataset.fieldPart="input",e.required&&l.setAttribute("aria-required","true"),C(l,a,i),d.appendChild(l),V(e.validation).includes("extension")){o.id=`${n}-label`,t.setAttribute("role","group"),t.setAttribute("aria-labelledby",o.id);let m=p("extension");m.type="text",m.maxLength=he,m.setAttribute("inputmode","numeric"),m.setAttribute("autocomplete","tel-extension"),C(m,null,i);let f=document.createElement("span");f.className="canopy-phone-extension";let y=document.createElement("label");y.className="canopy-phone-extension-label",y.dataset.fieldPart="label-extension",y.htmlFor=m.id,y.textContent=P(e.validation),f.append(y,m),d.appendChild(f)}return t.appendChild(d),t.appendChild(i),{wrapper:t,input:c,errorEl:i}}partsOf(e){return this.container.querySelectorAll(`input[data-name-field="${e}"], input[data-address-field="${e}"], select[data-address-field="${e}"], input[data-dob-field="${e}"], input[data-phone-field="${e}"]`)}collectValues(){let e={};return this.fieldElements.forEach((n,t)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")e[t]=n.input.checked;else if(n.input.type==="hidden"){let o=this.container.querySelector(`[data-checkbox-group="${t}"]`),a=this.container.querySelectorAll(`input[data-dob-field="${t}"]`),c=this.container.querySelectorAll(`input[data-phone-field="${t}"]`);if(a.length>0)e[t]=Xe([...a]);else if(c.length>0)e[t]=Object.fromEntries([...c].map(i=>[i.dataset.phonePart,i.value]));else if(o){let i=[];o.querySelectorAll("input[type=checkbox]:checked").forEach(d=>{var l;if(d.value!==k){i.push(d.value);return}let p=(l=o.querySelector("[data-choice-other]"))==null?void 0:l.value.trim();p&&i.push(p)}),e[t]=i}else{let i=this.container.querySelectorAll(`input[data-name-field="${t}"]`);if(i.length>0){let d={};i.forEach(p=>{let l=p,m=l.getAttribute("data-name-part");m&&(d[m]=l.value)}),e[t]=d}else{let d=this.container.querySelectorAll(`input[data-address-field="${t}"], select[data-address-field="${t}"]`);if(d.length>0){let p={};d.forEach(l=>{let m=l.getAttribute("data-address-part");m&&(p[m]=l.value)}),e[t]=p}else e[t]=n.input.value}}}else e[t]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value===k&&n.input.__otherInput?e[t]=n.input.__otherInput.value:e[t]=n.input.value}),e}findFailingInput(e){var d;let n=[...this.container.querySelectorAll(`input[data-dob-field="${e}"]`)];if(n.length>0){let[p,,l]=n;return(d=n.find(m=>!m.value.trim()))!=null?d:/^\d{4}$/.test(l.value.trim())?p:l}let[t,o]=this.container.querySelectorAll(`input[data-phone-field="${e}"]`);if(t)return o!=null&&o.value.trim()&&J(t.value)?o:t;let a=this.container.querySelectorAll(`input[data-name-field="${e}"]`),c=p=>p.getAttribute("aria-required")==="true"&&!p.value.trim()||p instanceof HTMLInputElement&&p.maxLength>0&&p.value.length>p.maxLength;if(a.length>0){for(let p of a)if(c(p))return p;return a[0]}let i=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(i.length>0){for(let p of i)if(c(p))return p;for(let p of i)if(p.getAttribute("data-address-part")==="postalCode")return p;return i[0]}return null}showErrors(e){this.fieldElements.forEach((t,o)=>{let a=e[o]||"";if(t.input.type==="hidden"){let c=this.container.querySelector(`[data-checkbox-group="${o}"]`);if(c){let i=c.querySelector("input[type=checkbox]");i&&i.setCustomValidity(a)}else{let i=a?this.findFailingInput(o):null;i?i.setCustomValidity(a):this.partsOf(o).forEach(d=>d.setCustomValidity(""))}}else t.input.setCustomValidity(a);t.errorEl.textContent=a,t.input.setAttribute("aria-invalid",a?"true":"false")});let n=Object.keys(e);if(n.length>0){let t=this.fieldElements.get(n[0]);if(t)if(t.input.type==="hidden"){let o=this.container.querySelector(`[data-checkbox-group="${n[0]}"]`);if(o){let a=o.querySelector("input[type=checkbox]");a&&(a.reportValidity(),a.focus())}else{let a=this.findFailingInput(n[0]);a&&(a.reportValidity(),a.focus())}}else t.input.reportValidity(),t.input.focus()}}setStatus(e,n){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(e){var o,a,c;if(e.preventDefault(),!this.formDefinition)return;this.setStatus("","info"),this.fieldElements.forEach((i,d)=>{if(i.input.setCustomValidity(""),i.input.type==="hidden"){let p=this.container.querySelector(`[data-checkbox-group="${d}"]`);if(p){let l=p.querySelector("input[type=checkbox]");l&&l.setCustomValidity("")}else this.partsOf(d).forEach(l=>l.setCustomValidity(""))}});let n=this.collectValues(),t=ve(this.formDefinition.fields,n);if(this.showErrors(t),Object.keys(t).length>0){let i=Object.keys(t).length;this.setStatus(`Please fix ${i} field${i>1?"s":""} to continue.`,"error");return}if(!this.options.preview){this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let i=this.options.baseUrl||"",d=this.options.formId||((o=this.formDefinition)==null?void 0:o.formId);if(!d){this.setStatus("Form configuration error.","error");return}let p=await fetch(`${i}/api/embed/${d}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),l=await p.json();if(!p.ok){l!=null&&l.fields&&this.showErrors(l.fields),this.setStatus((l==null?void 0:l.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}e.target.reset(),this.renderSuccess(this.formDefinition.successMessage||"Thanks for your submission!")}catch(i){console.error(i),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let i=((c=(a=this.formDefinition)==null?void 0:a.defaultTheme)==null?void 0:c.buttonText)||"Submit";this.submitButton.textContent=i,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}}renderSuccess(e){this.statusEl&&(this.statusEl.textContent="",this.statusEl.className="canopy-status"),this.formEl&&(this.formEl.style.display="none");let n=this.container.querySelector(".canopy-success");n&&n.remove();let t=document.createElement("div");t.className="canopy-success",t.setAttribute("role","status"),t.setAttribute("aria-live","polite");let o=document.createElement("div");o.className="canopy-success-icon",o.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',t.appendChild(o);let a=document.createElement("p");a.className="canopy-success-message",a.textContent=e,t.appendChild(a);let c=document.createElement("button");c.type="button",c.className="canopy-success-reset",c.textContent="Submit another response",c.addEventListener("click",()=>{this.formDefinition&&this.render(this.formDefinition)}),t.appendChild(c),this.container.appendChild(t)}renderSkeleton(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-skeleton";let n=[{labelW:"30%",type:"input"},{labelW:"45%",type:"input"},{labelW:"25%",type:"textarea"}],t=0,o=document.createElement("div");o.className="canopy-skeleton-bar canopy-skeleton-title",o.style.animationDelay=`${t}s`,e.appendChild(o),t+=.15;let a=document.createElement("div");a.className="canopy-skeleton-bar canopy-skeleton-desc",a.style.animationDelay=`${t}s`,e.appendChild(a),t+=.15;for(let i of n){let d=document.createElement("div");d.className="canopy-skeleton-field";let p=document.createElement("div");p.className="canopy-skeleton-bar canopy-skeleton-label",p.style.width=i.labelW,p.style.animationDelay=`${t}s`,d.appendChild(p),t+=.1;let l=document.createElement("div");l.className=`canopy-skeleton-bar canopy-skeleton-${i.type}`,l.style.animationDelay=`${t}s`,d.appendChild(l),t+=.15,e.appendChild(d)}let c=document.createElement("div");c.className="canopy-skeleton-bar canopy-skeleton-button",c.style.animationDelay=`${t}s`,e.appendChild(c),this.container.appendChild(e)}renderError(e){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=e,this.container.appendChild(n),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderInactive(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let n=document.createElement("h2");n.className="canopy-inactive-heading",n.textContent="Form Not Available",e.appendChild(n);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is not currently accepting responses. Please contact the form owner if you believe this is an error.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderHostedOnly(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let n=document.createElement("h2");n.className="canopy-inactive-heading",n.textContent="Form Not Available",e.appendChild(n);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is only available at its hosted URL and cannot be embedded. Please contact the form owner.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}};var Ce=`
.canopy-root {
  font-family: var(--canopy-font, inherit);
  font-size: var(--canopy-font-size, 16px);
  color: var(--canopy-text, #18181b);
  background: var(--canopy-bg, #ffffff);
  padding: 4px;
  --canopy-title-font: var(--canopy-font, inherit);
  --canopy-label-font: var(--canopy-font, inherit);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.canopy-form {
  display: grid;
  gap: 16px;
}

.canopy-form-actions {
  display: flex;
  justify-content: var(--canopy-button-align, left);
}

/* Admin preview only: instant tooltip pinned above the Submit button.
   Class + data-attribute are added by the embed when options.preview is true,
   so this never reaches production embeds. */
.canopy-root .canopy-submit-preview {
  position: relative;
}

.canopy-root .canopy-submit-preview::after {
  content: attr(data-preview-tooltip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 10px;
  background: #18181b;
  color: #fafafa;
  font-family: var(--canopy-font, inherit);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.3;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 120ms ease-out;
  z-index: 1;
}

.canopy-root .canopy-submit-preview::before {
  content: "";
  position: absolute;
  bottom: calc(100% + 2px);
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #18181b;
  pointer-events: none;
  opacity: 0;
  transition: opacity 120ms ease-out;
  z-index: 1;
}

.canopy-root .canopy-submit-preview:hover::after,
.canopy-root .canopy-submit-preview:focus-visible::after,
.canopy-root .canopy-submit-preview:hover::before,
.canopy-root .canopy-submit-preview:focus-visible::before {
  opacity: 1;
}

.canopy-density-compact .canopy-form {
  gap: 8px;
}

.canopy-density-comfortable .canopy-form {
  gap: 24px;
}

.canopy-field {
  display: grid;
  gap: 6px;
}

.canopy-label {
  font-family: var(--canopy-label-font, var(--canopy-font, inherit));
  font-size: var(--canopy-label-size, 18px);
  font-weight: var(--canopy-label-weight, 400);
  color: var(--canopy-label-color, var(--canopy-text, #18181b));
}

.canopy-required {
  color: var(--canopy-primary, #005F6A);
}

.canopy-root .canopy-input,
.canopy-root .canopy-textarea,
.canopy-root .canopy-select {
  display: block !important;
  width: 100%;
  box-sizing: border-box;
  border-radius: var(--canopy-radius, 8px);
  border: 1px solid var(--canopy-border, #e4e4e7) !important;
  padding: 10px 12px;
  font-family: var(--canopy-font, inherit);
  font-size: var(--canopy-font-size, 16px);
  background: var(--canopy-field-bg, #ffffff) !important;
  color: inherit;
  min-height: 40px;
  opacity: 1 !important;
  visibility: visible !important;
}

.canopy-root .canopy-textarea {
  min-height: 80px;
  resize: none;
}

.canopy-root .canopy-input:focus,
.canopy-root .canopy-textarea:focus,
.canopy-root .canopy-select:focus {
  outline: 2px solid var(--canopy-primary, #005F6A);
  outline-offset: 2px;
}

.canopy-root .canopy-input::placeholder,
.canopy-root .canopy-textarea::placeholder {
  color: var(--canopy-text, #18181b);
  opacity: 0.5;
}

/* Between a label and its box, as GOV.UK places hints: close under the
   label, with room before the box. */
.canopy-help-text {
  font-size: calc(var(--canopy-font-size, 16px) - 1px);
  color: var(--canopy-text, #18181b);
  margin: 0 0 4px;
  line-height: 1.4;
}

/* A Paragraph's character count, under its box; bold once it's over. */
.canopy-count {
  font-size: calc(var(--canopy-font-size, 16px) - 1px);
  color: var(--canopy-text, #18181b);
  margin: 0;
  line-height: 1.4;
}

.canopy-count[data-over] {
  font-weight: 700;
}

/* Errors show in native HTML5 validation popups, so their elements are
   hidden, kept in the DOM for screen readers, as is what only screen
   readers hear. */
.canopy-error,
.canopy-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.canopy-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.canopy-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.canopy-name-parts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.canopy-name-part {
  display: grid;
  gap: 4px;
  flex: 1 1 150px;
}

/* One or two characters: a full-width box would look like a mistake. */
.canopy-name-part-initial {
  flex: 0 0 4.5em;
}

.canopy-name-part-label {
  font-size: calc(var(--canopy-font-size, 16px) - 1px);
  font-weight: 500;
  color: var(--canopy-text, #18181b);
}

.canopy-address-parts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.canopy-address-part {
  display: grid;
  gap: 4px;
  flex: 1 1 100%;
}

/* City, State, and ZIP share a row, wrapping on a narrow form. */
.canopy-address-part-city {
  flex: 2 1 10em;
}

.canopy-address-part-region {
  flex: 1 1 8em;
}

.canopy-address-part-postalCode {
  flex: 0 1 7em;
}

.canopy-address-part-label {
  font-size: calc(var(--canopy-font-size, 16px) - 1px);
  font-weight: 500;
  color: var(--canopy-text, #18181b);
}

/* The number takes the row, the extension a short box beside it with its
   label before it; on a narrow form the extension wraps under. */
.canopy-phone-parts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.canopy-root .canopy-phone-parts > .canopy-input {
  flex: 1 1 12em;
  width: auto;
}

.canopy-phone-extension {
  display: flex;
  align-items: center;
  gap: 8px;
}

.canopy-root .canopy-phone-extension .canopy-input {
  width: 6em;
}

.canopy-phone-extension-label {
  font-size: calc(var(--canopy-font-size, 16px) - 1px);
  font-weight: 500;
  color: var(--canopy-text, #18181b);
}

/* Month, Day, and Year, each box as wide as its digits. */
.canopy-dob-parts {
  display: flex;
  gap: 12px;
}

.canopy-dob-part {
  display: grid;
  gap: 4px;
  width: 4.5em;
}

.canopy-dob-part-year {
  width: 6em;
}

.canopy-dob-part-label {
  font-size: calc(var(--canopy-font-size, 16px) - 1px);
  font-weight: 500;
  color: var(--canopy-text, #18181b);
}

.canopy-root .canopy-submit {
  display: block;
  width: var(--canopy-button-width, 100%);
  box-sizing: border-box;
  border: none;
  border-radius: var(--canopy-radius, 8px);
  padding: 10px 16px;
  /* Buttons don't inherit the page's font on their own. */
  font-family: var(--canopy-font, inherit);
  font-size: var(--canopy-font-size, 16px);
  font-weight: 600;
  background: var(--canopy-primary, #005F6A);
  color: var(--canopy-button-text, #ffffff);
  cursor: pointer;
  min-height: 40px;
}

.canopy-root .canopy-submit[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.canopy-status {
  font-size: var(--canopy-font-size, 16px);
}

.canopy-status.canopy-status-error {
  color: #FF6B5A;
}

.canopy-inactive {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--canopy-text, #18181b);
}

.canopy-inactive-heading {
  margin: 0;
  font-family: var(--canopy-title-font, var(--canopy-font, inherit));
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--canopy-title-color, var(--canopy-text, #18181b));
}

.canopy-inactive-body {
  margin: 0;
  max-width: 360px;
  color: var(--canopy-muted-text, #71717a);
  font-size: var(--canopy-font-size, 16px);
  line-height: 1.5;
}

.canopy-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  padding: 32px 24px;
  border-radius: var(--canopy-radius, 8px);
  animation: canopy-success-in 300ms ease-out;
}

@keyframes canopy-success-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.canopy-success-icon {
  width: 56px;
  height: 56px;
  border-radius: 9999px;
  background: var(--canopy-primary, #005F6A);
  color: var(--canopy-button-text, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.canopy-success-icon svg {
  width: 28px;
  height: 28px;
}

.canopy-success-message {
  font-family: var(--canopy-font, inherit);
  font-size: var(--canopy-font-size, 16px);
  color: var(--canopy-text, #18181b);
  line-height: 1.5;
  margin: 0;
  max-width: 420px;
  white-space: pre-wrap;
}

.canopy-success-reset {
  background: none;
  border: none;
  color: var(--canopy-primary, #005F6A);
  font-family: var(--canopy-font, inherit);
  font-size: calc(var(--canopy-font-size, 16px) - 1px);
  font-weight: 500;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: var(--canopy-radius, 8px);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.canopy-success-reset:hover {
  opacity: 0.75;
}

.canopy-success-reset:focus-visible {
  outline: 2px solid var(--canopy-primary, #005F6A);
  outline-offset: 2px;
}

.canopy-header {
  margin-bottom: 16px;
}

/* Skeleton empty state */
@keyframes canopy-shimmer {
  0% { opacity: 0.4; }
  50% { opacity: 0.7; }
  100% { opacity: 0.4; }
}

.canopy-skeleton {
  display: grid;
  gap: 16px;
  pointer-events: none;
  user-select: none;
}

.canopy-skeleton-bar {
  border-radius: var(--canopy-radius, 8px);
  background: var(--canopy-border, #e4e4e7);
  animation: canopy-shimmer 2s ease-in-out infinite;
}

.canopy-skeleton-title {
  height: 1.4em;
  width: 55%;
  border-radius: 4px;
}

.canopy-skeleton-desc {
  height: 0.85em;
  width: 80%;
  border-radius: 4px;
  margin-top: -8px;
}

.canopy-skeleton-field {
  display: grid;
  gap: 6px;
}

.canopy-skeleton-label {
  height: 0.85em;
  border-radius: 4px;
}

.canopy-skeleton-input {
  height: 40px;
  border: 1px solid var(--canopy-border, #e4e4e7);
  background: var(--canopy-field-bg, #ffffff);
}

.canopy-skeleton-textarea {
  height: 80px;
  border: 1px solid var(--canopy-border, #e4e4e7);
  background: var(--canopy-field-bg, #ffffff);
}

.canopy-skeleton-button {
  height: 40px;
  width: var(--canopy-button-width, 100%);
  background: var(--canopy-primary, #005F6A);
  opacity: 0.25;
}

.canopy-title {
  font-family: var(--canopy-title-font, var(--canopy-font, inherit));
  font-size: var(--canopy-title-size, 28px);
  font-weight: var(--canopy-title-weight, 400);
  color: var(--canopy-title-color, var(--canopy-text, #18181b));
  text-align: var(--canopy-title-align, left);
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.canopy-description {
  font-size: var(--canopy-font-size, 16px);
  color: var(--canopy-text, #18181b);
  margin: 0;
  line-height: 1.5;
}

.canopy-watermark {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--canopy-border, #e4e4e7);
  font-family: var(--canopy-font, inherit);
  font-size: 11px;
  line-height: 1.4;
  color: var(--canopy-text, #18181b);
  opacity: 0.55;
}

.canopy-watermark-sep {
  opacity: 0.6;
}

.canopy-root .canopy-watermark-link {
  color: var(--canopy-primary, #005F6A);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.canopy-root .canopy-watermark-link:hover {
  opacity: 0.8;
}

.canopy-root .canopy-watermark-link:focus-visible {
  outline: 2px solid var(--canopy-primary, #005F6A);
  outline-offset: 2px;
  border-radius: 2px;
}
`;var Te="canopy-embed-styles";function Ke(){if(document.getElementById(Te))return;let r=document.createElement("style");r.id=Te,r.textContent=Ce,document.head.appendChild(r)}function Ze(r){var e;return r.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function Ye(r){let e=r.dataset.theme;if(e)try{return JSON.parse(e)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function te(){Ke(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=e.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let t=Ye(e),o=Ze(e);new F(e,{formId:n,themeOverrides:t,baseUrl:o}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",te):te();window.CanopyForms={init:te,CanopyForm:F};})();
