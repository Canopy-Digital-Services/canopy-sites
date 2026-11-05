"use strict";(()=>{var v={fontSize:16,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:4,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:28,titleWeight:"normal",titleAlign:"left",labelSize:18,labelWeight:"normal"},H=new Set;function C(r,e){if(!r)return e;let n=r.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:e:e}function ee(r){if(!r)return{};let{headingFont:e,...n}=r;return e?{titleFont:e,labelFont:e,...n}:n}function re(r,e){return{...v,...ee(r),...ee(e)}}function Ce(r){let e=/^#?([0-9a-f]{6})$/i.exec(r.trim());if(!e)return null;let n=parseInt(e[1],16);return[n>>16&255,n>>8&255,n&255]}function Te(r,e,n){let[t,o,a]=[r,e,n].map(l=>{let i=l/255;return i<=.03928?i/12.92:Math.pow((i+.055)/1.055,2.4)});return .2126*t+.7152*o+.0722*a}function te(r){let e=Ce(r);return e?Te(...e):null}function we(r,e){let n=te(r);if(n===null||n<=.179)return"#ffffff";let t=te(e);return t!==null&&(n+.05)/(t+.05)>=4.5?e:v.text}function ae(r,e){var d,c,m,u,h,s;let n=ne(e.bodyFont,e.fontFamily);r.style.setProperty("--canopy-font",n);for(let[p,y]of[["--canopy-title-font",e.titleFont],["--canopy-label-font",e.labelFont]]){let b=ne(y);r.style.setProperty(p,b==="inherit"?"var(--canopy-font)":b)}r.style.setProperty("--canopy-font-size",`${(d=e.fontSize)!=null?d:v.fontSize}px`);let t=C(e.text,v.text);r.style.setProperty("--canopy-text",t),r.style.setProperty("--canopy-bg",C(e.background,v.background)),r.style.setProperty("--canopy-field-bg",C(e.fieldBackground,v.fieldBackground));let o=C(e.primary,v.primary);r.style.setProperty("--canopy-primary",o),r.style.setProperty("--canopy-button-text",C(e.buttonTextColor,"")||we(o,t)),r.style.setProperty("--canopy-border",C(e.border,v.border)),r.style.setProperty("--canopy-radius",`${(c=e.radius)!=null?c:v.radius}px`),r.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),r.style.setProperty("--canopy-button-align",e.buttonAlign||v.buttonAlign);let a={sm:"1.25em",md:"1.5em",lg:"1.875em",xl:"2.25em"},l=(p,y)=>{var f;let b=Number(p);return b>0?`${b}px`:(f=a[String(p)])!=null?f:`${Number(y)}px`};r.style.setProperty("--canopy-title-size",l(e.titleSize,v.titleSize)),r.style.setProperty("--canopy-label-size",l(e.labelSize,v.labelSize));let i={light:"300",normal:"400",medium:"500",bold:"700",semibold:"700"};r.style.setProperty("--canopy-title-weight",(u=i[(m=e.titleWeight)!=null?m:"normal"])!=null?u:"400"),r.style.setProperty("--canopy-label-weight",(s=i[(h=e.labelWeight)!=null?h:"normal"])!=null?s:"400");for(let[p,y]of[["--canopy-title-color",e.titleColor],["--canopy-label-color",e.labelColor]]){let b=y?C(y,""):"";b?r.style.setProperty(p,b):r.style.removeProperty(p)}r.style.setProperty("--canopy-title-align",e.titleAlign==="center"?"center":"left")}function oe(r){switch(r.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function ne(r,e){return r&&r!=="inherit"?`'${r}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function ie(r,e){let n=r.filter(l=>!!l&&l!=="inherit"&&!H.has(l));if(n.length===0)return;let t=n.map(l=>`family=${encodeURIComponent(l)}`).join("&"),o=`${e}/api/fonts?${t}`,a=document.createElement("link");a.rel="stylesheet",a.href=o,a.dataset.canopyFont="true",document.head.appendChild(a),n.forEach(l=>H.add(l))}function se(r){if(!r||H.has(r))return;let e=document.createElement("link");e.rel="stylesheet",e.href=r,e.dataset.canopyFont="true",document.head.appendChild(e),H.add(r)}var j="Name",Le={first:"First",middle:"Middle",middleInitial:"M.I.",last:"Last",single:j},S=["first","last"],le=["first","middle","middleInitial","last","single"];function ce(r){return[...r].sort((e,n)=>le.indexOf(e)-le.indexOf(n))}function F(r,e){var t;if(r!=null&&r.requiredParts)return r.requiredParts;let n=(t=r==null?void 0:r.parts)!=null?t:S;return e?n.filter(o=>o!=="middle"&&o!=="middleInitial"):[]}function D(r){return r==="middleInitial"?2:100}function R(r,e){return(e==null?void 0:e[r])||Le[r]||r}var Ne={line1:"Street",line2:"Apt, suite",city:"City",region:"State",postalCode:"ZIP"},pe=["line1","line2","city","region","postalCode"];function w(r){var n;let e=(n=r==null?void 0:r.parts)!=null?n:pe;return pe.filter(t=>e.includes(t))}function T(r,e){return(e==null?void 0:e[r])||Ne[r]||r}function G(r,e){return r!=null&&r.requiredParts?r.requiredParts:e?w(r).filter(n=>n!=="line2"):[]}var _=200,Se=/^\d{5}(-\d{4})?$/;function de(r,e,n){let t=w(e),o=G(e,n),a=i=>{var d;return String((d=r==null?void 0:r[i])!=null?d:"")},l=i=>a(i).trim();for(let i of t){if(o.includes(i)&&!l(i))return`${T(i,e==null?void 0:e.partLabels)} is required.`;if(a(i).length>_)return`${T(i,e==null?void 0:e.partLabels)} must be ${_} characters or fewer.`}return t.includes("postalCode")&&l("postalCode")&&!Se.test(l("postalCode"))?`${T("postalCode",e==null?void 0:e.partLabels)} must be a US ZIP code, like 12345 or 12345-6789.`:null}var X="Choose one...",q="Other",L="__other__";function $(r){let e=Array.isArray(r)?r:r==null?void 0:r.options;return Array.isArray(e)?e.filter(n=>typeof n=="object"&&n!==null&&typeof n.value=="string"):[]}function N(r){return!Array.isArray(r)&&(r==null?void 0:r.allowOther)===!0}var $e=6,ue=r=>$(r).length+(N(r)?1:0)<=$e;function Z(r,e,n,t){let o=r==="CHOOSE_SEVERAL"?e:typeof e=="string"?[e]:null;if(!Array.isArray(o)||o.some(i=>typeof i!="string"))return`${t} must be one of its options.`;if(new Set(o).size<o.length)return`${t} picks an option more than once.`;let a=$(n).map(i=>i.value),l=o.filter(i=>!a.includes(i));return l.length===0?null:!N(n)||l.length>1?`${t} must be one of its options.`:l[0].length>200?`${t} must be 200 characters or fewer.`:null}var Oe="Ext.";function z(r){let e=r==null?void 0:r.parts;return Array.isArray(e)&&e.includes("extension")?["number","extension"]:["number"]}function O(r){var e;return((e=r==null?void 0:r.partLabels)==null?void 0:e.extension)||Oe}function Y(r){let e=r.trim().replace(/[\s().-]/g,"");if(!/^\+?\d+$/.test(e))return null;let n=e.replace("+","");if(e.startsWith("+")&&!n.startsWith("1"))return n.length>=7&&n.length<=15?`+${n}`:null;let t=n.length===11&&n.startsWith("1")?n.slice(1):n;return t.length===10?`+1${t}`:null}var K=30,Pe=/^\d{1,10}$/,me=10;function he(r,e,n,t){var l,i,d,c;let o=(i=(l=r==null?void 0:r.number)==null?void 0:l.trim())!=null?i:"",a=(c=(d=r==null?void 0:r.extension)==null?void 0:d.trim())!=null?c:"";return o?o.length>K||!Y(o)?`${t} must be a phone number, like (201) 555-0123 or +44 20 7946 0958.`:a&&!Pe.test(a)?`${O(e)} must be a number, like 45.`:null:a?`${t} must include a phone number.`:n?`${t} is required.`:null}var B={TEXT:200,EMAIL:254,TEXTAREA:1e4,NUMBER:50,DATE:30,DATE_OF_BIRTH:10,WEBSITE:2e3};function fe(r){return typeof r.validation=="object"&&r.validation!==null?r.validation:{}}function V(r){if(r.type!=="TEXTAREA")return;let e=fe(r).maxLength;return Number.isInteger(e)&&e>=1&&e<=B.TEXTAREA?e:void 0}var W=r=>`${r.toLocaleString("en-US")} character${r===1?"":"s"}`,ke=/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;function Me(r){return r.length>320||/[\r\n]/.test(r)?!1:ke.test(r)}function P(r=new Date){let e=(n,t=2)=>String(n).padStart(t,"0");return`${e(r.getFullYear(),4)}-${e(r.getMonth()+1)}-${e(r.getDate())}`}function be(){let r=P();return{earliest:r,latest:r}}function ge(r){if(/^\d{4}-\d{2}-\d{2}$/.test(r)){let n=new Date(`${r}T00:00:00Z`);return!isNaN(n.getTime())&&n.toISOString().slice(0,10)===r?r:null}let e=new Date(r);return isNaN(e.getTime())?null:P(e)}function Ie(r){let e=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(r);return e?ge(`${e[1]}-${e[2].padStart(2,"0")}-${e[3].padStart(2,"0")}`):null}function He(r){let e=String(r).replace(/[,\s]/g,"");return/^-?(\d+\.?\d*|\.\d+)$/.test(e)?e:null}function Fe(r){let e=r.trim();if(/\s/.test(e))return null;let n=/^https?:\/\//i.test(e)?e:`https://${e}`;try{let t=new URL(n),o=t.hostname.split(".");return o.length>1&&o.every(Boolean)&&!t.username&&!t.password?n:null}catch(t){return null}}function ye(r,e,n){return e!==void 0&&r.length>e?`${n} must be ${W(e)} or fewer.`:null}function J(r,e,n,t){if(r==null)return null;if(typeof r!="object"||Array.isArray(r))return`${t} must be an object of its parts.`;for(let[o,a]of Object.entries(r)){if(!e.includes(o))return`${t} has no part "${o}".`;if(typeof a!="string")return`${n(o)} must be text.`}return null}function De(r,e,n=be()){var d,c,m;let t=r.label||r.name,o=fe(r);switch(r.type){case"APPROVAL":return e!=null&&typeof e!="boolean"&&e!=="on"?`${t} must be true or false.`:r.required&&!e?"Check the box to continue.":null;case"CHOOSE_SEVERAL":if(!Array.isArray(e)||e.length===0){if(r.required)return"Choose at least one.";if(e==null||Array.isArray(e))return null}return Z("CHOOSE_SEVERAL",e,r.options,t);case"NAME":{let u=typeof r.options=="object"&&r.options!==null?r.options:{},h=u.parts||S,s=f=>f==="single"?t:R(f,u.partLabels),p=J(e,h,s,t);if(p)return p;let y=e,b=F(u,r.required);for(let f of h){let g=y==null?void 0:y[f],E=s(f);if(b.includes(f)&&(!g||String(g).trim()===""))return`${E} is required.`;let x=ye(String(g!=null?g:""),D(f),E);if(x)return x}return null}case"PHONE":{let u=h=>h==="extension"?O(r.validation):t;return(d=J(e,z(r.validation),u,t))!=null?d:he(e,r.validation,r.required,t)}case"ADDRESS":{let u=r.options,h=s=>T(s,u==null?void 0:u.partLabels);return(c=J(e,w(u),h,t))!=null?c:de(e,u,r.required)}}let a=r.type==="CHOOSE_ONE"?"Choose an answer.":`${t} is required.`;if(e==null)return r.required?a:null;if(typeof e!="string"&&!(r.type==="NUMBER"&&typeof e=="number"))return r.type==="NUMBER"?`${t} must be a number.`:`${t} must be text.`;let l=String(e);if(l.trim()==="")return r.required?a:null;let i=ye(l,(m=V(r))!=null?m:B[r.type],t);if(i)return i;switch(r.type){case"CHOOSE_ONE":return Z("CHOOSE_ONE",e,r.options,t);case"DATE":{let u=ge(l);return u?o.minDate==="today"&&u<n.earliest?`${t} must be today or in the future.`:o.maxDate==="today"&&u>n.latest?`${t} must be today or in the past.`:null:`${t} must be a real date.`}case"DATE_OF_BIRTH":{let[u="",h="",s=""]=l.split("-");if(!h.trim())return`${t} must include a month.`;if(!s.trim())return`${t} must include a day.`;if(!u.trim())return`${t} must include a year.`;if(!/^\d{4}$/.test(u))return"Year must include 4 numbers.";let p=Ie(l);return p?p>=n.latest?`${t} must be in the past.`:null:`${t} must be a real date.`}case"NUMBER":{let{min:u,max:h,integer:s}=o,p=Math.min(Math.max(10,u!=null?u:-1/0),h!=null?h:1/0),y=He(e);if(y===null)return`${t} must be a ${s?"whole ":""}number, like ${p}.`;let b=Number(y);return s&&!Number.isInteger(b)?`${t} must be a whole number, like ${p}.`:u!==void 0&&b<u||h!==void 0&&b>h?u!==void 0&&h!==void 0?`${t} must be between ${u} and ${h}.`:u!==void 0?`${t} must be ${u} or more.`:`${t} must be ${h} or ${s?"fewer":"less"}.`:null}case"WEBSITE":return Fe(l)?null:`${t} must be a web address, like example.com.`;case"EMAIL":return Me(l.trim())?null:`${t} must be an email address, like name@example.com.`;default:return null}}function xe(r,e,n=be()){let t={};for(let o of r){let a=De(o,Re(e,o.name),n);a&&(t[o.name]=a)}return t}function Re(r,e){return Object.prototype.hasOwnProperty.call(r,e)?r[e]:void 0}var Ee=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var qe={single:"name",first:"given-name",middle:"additional-name",last:"family-name"},ze={line1:"address-line1",line2:"address-line2",city:"address-level2",region:"address-level1",postalCode:"postal-code"},Be=[["month","Month",2,"bday-month"],["day","Day",2,"bday-day"],["year","Year",4,"bday-year"]],Ve=r=>{let[e,n,t]=r.map(a=>a.value.trim());if(!e&&!n&&!t)return"";let o=a=>/^\d$/.test(a)?`0${a}`:a;return`${t}-${o(e)}-${o(n)}`},A=(r,e,n,t)=>r.setAttribute("aria-describedby",[e,t,n].flatMap(o=>o?[o.id]:[]).join(" ")),We="feedback@canopyds.com",Ue=0,k=class extends Error{constructor(e){super(e),this.name="InactiveFormError"}},M=class extends Error{constructor(e){super(e),this.name="HostedOnlyFormError"}},I=class{constructor(e,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.formEl=null;this.submitButton=null;this.instanceId=`canopy-${Ue++}`;this.container=e,this.options=n}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){if(console.error(e),e instanceof k){this.renderInactive();return}if(e instanceof M){this.renderHostedOnly();return}this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var o;let e=this.options.baseUrl||"",n=this.options.formId||((o=this.formDefinition)==null?void 0:o.formId);if(!n)throw new Error("Form configuration error: no formId");let t=await fetch(`${e}/api/embed/${n}`,{method:"GET",credentials:"omit"});if(!t.ok){if(t.status===403)try{let a=await t.json();if((a==null?void 0:a.code)==="FORM_INACTIVE")throw new k(a.error||"Form is inactive");if((a==null?void 0:a.code)==="FORM_HOSTED_ONLY")throw new M(a.error||"Form is only available at its hosted URL")}catch(a){if(a instanceof k||a instanceof M)throw a}throw new Error("Failed to load form definition")}return t.json()}renderFromDefinition(e){this.container.classList.add("canopy-root"),this.formDefinition=e,this.render(e)}render(e){this.container.innerHTML="",this.fieldElements.clear();let n=re(e.defaultTheme,this.options.themeOverrides);ae(this.container,n),ie([n.bodyFont,n.titleFont,n.labelFont],this.options.baseUrl||""),!n.bodyFont&&!n.titleFont&&!n.labelFont&&se(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(oe(n));let t=e.fields&&e.fields.length>0,o=e.title||e.description;if(!t&&!o){this.renderSkeleton();return}if(e.title||e.description){let p=document.createElement("div");if(p.className="canopy-header",e.title){let y=document.createElement("h2");y.className="canopy-title",y.textContent=e.title,p.appendChild(y)}if(e.description){let y=document.createElement("p");y.className="canopy-description",y.textContent=e.description,p.appendChild(y)}this.container.appendChild(p)}let a=document.createElement("div");a.className="canopy-status",a.setAttribute("role","alert"),a.setAttribute("aria-live","assertive"),this.statusEl=a;let l=document.createElement("form");l.className="canopy-form",l.addEventListener("submit",p=>this.handleSubmit(p)),this.formEl=l,e.fields.forEach(p=>{let{wrapper:y,input:b,errorEl:f}=this.createField(p);y&&(y.dataset.fieldName=p.name,l.appendChild(y)),this.fieldElements.set(p.name,{input:b,errorEl:f})}),this.options.preview&&(l.setAttribute("autocomplete","off"),l.querySelectorAll("input, select, textarea").forEach(p=>p.setAttribute("autocomplete","off")));let i=document.createElement("button");i.type="submit",i.className="canopy-submit",i.textContent=n.buttonText||"Submit",this.options.preview&&(i.classList.add("canopy-submit-preview"),i.setAttribute("data-preview-tooltip","For preview only. No submission will be created"));let d=getComputedStyle(this.container),c=d.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",m=d.getPropertyValue("--canopy-button-text").trim()||"#ffffff",u=d.getPropertyValue("--canopy-radius").trim()||"8px",h=d.getPropertyValue("--canopy-button-width").trim()||"100%";i.style.cssText=`
      display: block !important;
      width: ${h} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${u} !important;
      padding: 10px 16px !important;
      font-family: var(--canopy-font, inherit) !important;
      font-size: var(--canopy-font-size, 16px) !important;
      font-weight: 600 !important;
      background: ${c} !important;
      background-color: ${c} !important;
      color: ${m} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=i;let s=document.createElement("div");s.className="canopy-form-actions",s.appendChild(i),l.appendChild(s),this.container.appendChild(a),this.container.appendChild(l),this.container.appendChild(this.renderWatermark(e))}renderWatermark(e){let n=document.createElement("div");n.className="canopy-watermark";let t=document.createElement("span");t.className="canopy-watermark-brand",t.textContent="Powered by Canopy Forms (Beta)",n.appendChild(t);let o=document.createElement("span");o.className="canopy-watermark-sep",o.setAttribute("aria-hidden","true"),o.textContent="\xB7",n.appendChild(o);let a=(e==null?void 0:e.title)||(e==null?void 0:e.name)||(e==null?void 0:e.formId)||"unknown form",l=(e==null?void 0:e.formId)||"unknown",i=`Canopy Forms issue \u2014 ${a}`,d=[`Form: ${a}`,`Form ID: ${l}`,"","Describe the issue:",""].join(`
`),c=`mailto:${We}?subject=${encodeURIComponent(i)}&body=${encodeURIComponent(d)}`,m=document.createElement("a");return m.className="canopy-watermark-link",m.href=c,m.textContent="Report an issue",m.rel="noopener",n.appendChild(m),n}createField(e){var u,h;let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field";let o=document.createElement("label");if(o.className="canopy-label",o.dataset.fieldPart="label",o.htmlFor=n,o.textContent=e.label||e.name,e.required){let s=document.createElement("span");s.className="canopy-required",s.textContent=" *",s.setAttribute("aria-hidden","true"),o.appendChild(s)}let a;switch(e.type){case"TEXTAREA":{let s=document.createElement("textarea");s.className="canopy-textarea";let p=V(e);s.rows=p?Math.min(Math.max(Math.ceil(p/60),4),15):5,a=s;break}case"CHOOSE_ONE":{if(ue(e.options))return this.createChoiceGroup(e,t,o,n,"radio");let s=$(e.options),p=N(e.options),y=document.createElement("select");y.className="canopy-select";let b=document.createElement("option");if(b.value="",b.textContent=X,b.disabled=!0,b.selected=!0,y.appendChild(b),s.forEach(f=>{let g=document.createElement("option");g.value=f.value,g.textContent=f.label,y.appendChild(g)}),p){let f=document.createElement("option");f.value=L,f.textContent=q,y.appendChild(f)}if(a=y,p){let f=this.createOtherInput(e);y.addEventListener("change",()=>{y.value===L?(f.style.setProperty("display","block","important"),e.required&&(f.required=!0)):(f.style.setProperty("display","none","important"),f.required=!1,f.value="")}),y.__otherInput=f}break}case"APPROVAL":{let s=document.createElement("label");s.className="canopy-choice";let p=document.createElement("input");p.type="checkbox",p.id=n,p.name=e.name,e.required&&p.setAttribute("aria-required","true"),p.addEventListener("change",()=>{p.setCustomValidity("")}),s.appendChild(p);let y=document.createElement("span");if(y.dataset.fieldPart="label",y.textContent=e.label||e.name,e.required){let g=document.createElement("span");g.className="canopy-required",g.textContent=" *",g.setAttribute("aria-hidden","true"),y.appendChild(g)}s.appendChild(y),t.appendChild(s);let b=this.createHelpText(e,n);b&&t.appendChild(b);let f=document.createElement("span");return f.className="canopy-error",f.id=`${n}-error`,t.appendChild(f),A(p,b,f),p.setAttribute("aria-invalid","false"),{wrapper:t,input:p,errorEl:f}}case"CHOOSE_SEVERAL":return this.createChoiceGroup(e,t,o,n,"checkbox");case"EMAIL":{let s=document.createElement("input");s.type="text",s.className="canopy-input",s.setAttribute("inputmode","email"),s.setAttribute("autocomplete","email"),s.setAttribute("autocapitalize","none"),s.setAttribute("autocorrect","off"),s.spellcheck=!1,a=s;break}case"WEBSITE":{let s=document.createElement("input");s.type="text",s.className="canopy-input",s.setAttribute("inputmode","url"),s.setAttribute("autocomplete","url"),s.setAttribute("autocapitalize","none"),s.setAttribute("autocorrect","off"),s.spellcheck=!1,a=s;break}case"DATE":{let s=document.createElement("input");s.type="date",s.className="canopy-input",((u=e.validation)==null?void 0:u.minDate)==="today"&&(s.min=P()),((h=e.validation)==null?void 0:h.maxDate)==="today"&&(s.max=P()),a=s;break}case"NUMBER":{let s=document.createElement("input");s.type="text",s.className="canopy-input",s.spellcheck=!1;let p=e.validation;(p==null?void 0:p.min)!==void 0&&p.min<0||s.setAttribute("inputmode",p!=null&&p.integer?"numeric":"decimal"),a=s;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);case"DATE_OF_BIRTH":return this.createDateOfBirthField(e);case"PHONE":return this.createPhoneField(e);default:{let s=document.createElement("input");s.type="text",s.className="canopy-input",a=s}}a.id=n,a.name=e.name,a.dataset.fieldPart="input",a.setAttribute("aria-invalid","false"),e.required&&a.setAttribute("aria-required","true");let l=B[e.type];l&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=l),a.addEventListener("input",()=>{a.setCustomValidity("")});let i=document.createElement("span");i.className="canopy-error",i.id=`${n}-error`;let d=this.createHelpText(e,n);t.appendChild(o),d&&t.appendChild(d),t.appendChild(a);let c=V(e),m=c&&a instanceof HTMLTextAreaElement?this.addCharacterCount(t,a,c,n):void 0;return A(a,d,i,m),a.__otherInput&&t.appendChild(a.__otherInput),t.appendChild(i),{wrapper:t,input:a,errorEl:i}}createHelpText(e,n){if(!e.helpText)return null;let t=document.createElement("p");return t.className="canopy-help-text",t.id=`${n}-help`,t.textContent=e.helpText,t}addCharacterCount(e,n,t,o){let a=document.createElement("p");a.className="canopy-visually-hidden",a.id=`${o}-limit`,a.textContent=`You can enter up to ${W(t)}`;let l=document.createElement("p");l.className="canopy-count",l.setAttribute("aria-hidden","true");let i=document.createElement("p");i.className="canopy-visually-hidden",i.setAttribute("aria-live","polite");let d=()=>{let m=t-n.value.length;l.textContent=`You have ${W(Math.abs(m))} ${m<0?"too many":"remaining"}`,l.toggleAttribute("data-over",m<0)},c;return n.addEventListener("input",()=>{d(),clearTimeout(c),c=setTimeout(()=>i.textContent=l.textContent,1e3)}),d(),e.append(a,l,i),a}createChoiceGroup(e,n,t,o,a){let l=$(e.options),i=document.createElement("div");i.className="canopy-choices",a==="radio"&&l.length===2&&!N(e.options)&&i.classList.add("canopy-choices-inline"),i.setAttribute("data-choice-group",e.name),a==="radio"&&i.setAttribute("data-choice-one","");let d=()=>{var s;return(s=i.querySelector("input"))==null?void 0:s.setCustomValidity("")},c=(s,p,y)=>{let b=document.createElement("label");b.className="canopy-choice",b.dataset.fieldPart=y;let f=document.createElement("input");f.type=a,f.name=e.name,f.value=s,f.addEventListener("change",d);let g=document.createElement("span");return g.textContent=p,b.append(f,g),i.appendChild(b),f};if(l.forEach((s,p)=>c(s.value,s.label,`option-${p}`)),N(e.options)){let s=c(L,q,"option-other"),p=this.createOtherInput(e);p.dataset.choiceOther=e.name,p.addEventListener("input",d),i.addEventListener("change",()=>{s.checked?p.style.display==="none"&&(p.style.setProperty("display","block","important"),p.focus()):(p.style.setProperty("display","none","important"),p.value="")}),i.appendChild(p)}let m=document.createElement("input");m.type="hidden",m.id=o,m.name=e.name,t.id=`${o}-label`,i.setAttribute("role",a==="radio"?"radiogroup":"group"),i.setAttribute("aria-labelledby",t.id);let u=this.createHelpText(e,o);n.appendChild(t),u&&n.appendChild(u),n.appendChild(i);let h=document.createElement("span");return h.className="canopy-error",h.id=`${o}-error`,n.appendChild(h),A(i,u,h),m.setAttribute("aria-invalid","false"),{wrapper:n,input:m,errorEl:h}}createOtherInput(e){let n=document.createElement("input");return n.type="text",n.className="canopy-input canopy-choice-other",n.name=`${e.name}_other`,n.placeholder="Please specify...",n.maxLength=200,n.setAttribute("aria-label",`${e.label||e.name}: ${q}`),n.style.setProperty("display","none","important"),n.addEventListener("input",()=>{n.setCustomValidity("")}),n}createNameField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-name-group",t.setAttribute("role","group");let o=e.options||{},a=ce(o.parts||S),l=F(o,e.required),i=e.label||j,d=a.includes("single"),c=this.createHelpText(e,n);if(d)t.setAttribute("aria-label",i);else{let s=document.createElement("span");s.id=`${n}-group-label`,s.className="canopy-label",s.dataset.fieldPart="label",s.textContent=i,t.appendChild(s),c&&t.appendChild(c),t.setAttribute("aria-labelledby",s.id)}let m=document.createElement("div");m.className="canopy-name-parts";let u=document.createElement("input");u.type="hidden",u.id=n,u.name=e.name;let h=document.createElement("span");return h.className="canopy-error",h.id=`${n}-error`,a.forEach(s=>{let p=document.createElement("div");p.className=s==="middleInitial"?"canopy-name-part canopy-name-part-initial":"canopy-name-part";let y=document.createElement("label");y.className=d?"canopy-label":"canopy-name-part-label";let b=`${n}-${s}`;y.htmlFor=b,y.textContent=d?i:R(s,o.partLabels),y.dataset.fieldPart=d?"label":`label-${s}`;let f=l.includes(s);if(f){let x=document.createElement("span");x.className="canopy-required",x.textContent=" *",x.setAttribute("aria-hidden","true"),y.appendChild(x)}let g=document.createElement("input");g.type="text",g.className="canopy-input",g.id=b,g.name=`${e.name}.${s}`,g.setAttribute("data-name-part",s),g.setAttribute("data-name-field",e.name),g.maxLength=D(s);let E=qe[s];E&&g.setAttribute("autocomplete",E),f&&g.setAttribute("aria-required","true"),g.addEventListener("input",()=>{m.querySelectorAll("input[data-name-part]").forEach(x=>x.setCustomValidity(""))}),p.appendChild(y),d&&c&&p.appendChild(c),p.appendChild(g),m.appendChild(p)}),t.appendChild(m),A(t,c,h),t.appendChild(h),{wrapper:t,input:u,errorEl:h}}createAddressField(e){let n=`${this.instanceId}-${e.name}`,t=e.options||{},o=document.createElement("div");o.className="canopy-field canopy-address-group",o.setAttribute("role","group"),o.setAttribute("aria-labelledby",`${n}-group-label`);let a=document.createElement("span");a.id=`${n}-group-label`,a.className="canopy-label",a.dataset.fieldPart="label",a.textContent=e.label||"Address",o.appendChild(a);let l=this.createHelpText(e,n);l&&o.appendChild(l);let i=document.createElement("div");i.className="canopy-address-parts";let d=document.createElement("input");d.type="hidden",d.id=n,d.name=e.name;let c=document.createElement("span");c.className="canopy-error",c.id=`${n}-error`;let m={postalCode:{maxlength:"10",inputmode:"numeric"}},u=G(t,e.required);return w(t).forEach(h=>{let s=u.includes(h),p=document.createElement("div");p.className=`canopy-address-part canopy-address-part-${h}`;let y=document.createElement("label");y.className="canopy-address-part-label";let b=`${n}-${h}`;if(y.htmlFor=b,y.textContent=T(h,t.partLabels),y.dataset.fieldPart=`label-${h}`,s){let g=document.createElement("span");g.className="canopy-required",g.textContent=" *",g.setAttribute("aria-hidden","true"),y.appendChild(g)}let f;if(h==="region"){let g=document.createElement("select");g.className="canopy-select";let E=document.createElement("option");E.value="",E.textContent=X,g.appendChild(E),Ee.forEach(x=>{let U=document.createElement("option");U.value=x.value,U.textContent=x.label,g.appendChild(U)}),g.addEventListener("change",()=>{i.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(x=>x.setCustomValidity(""))}),f=g}else{let g=document.createElement("input");g.type="text",g.className="canopy-input",g.maxLength=_,m[h]&&Object.entries(m[h]).forEach(([E,x])=>g.setAttribute(E,x)),g.addEventListener("input",()=>{i.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(E=>E.setCustomValidity(""))}),f=g}f.id=b,f.setAttribute("autocomplete",ze[h]),f.setAttribute("data-address-part",h),f.setAttribute("data-address-field",e.name),s&&f.setAttribute("aria-required","true"),p.appendChild(y),p.appendChild(f),i.appendChild(p)}),o.appendChild(i),A(o,l,c),o.appendChild(c),{wrapper:o,input:d,errorEl:c}}createDateOfBirthField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-dob-group",t.setAttribute("role","group");let o=document.createElement("span");if(o.id=`${n}-group-label`,o.className="canopy-label",o.dataset.fieldPart="label",o.textContent=e.label||e.name,e.required){let c=document.createElement("span");c.className="canopy-required",c.textContent=" *",c.setAttribute("aria-hidden","true"),o.appendChild(c)}t.appendChild(o),t.setAttribute("aria-labelledby",o.id);let a=this.createHelpText(e,n);a&&t.appendChild(a);let l=document.createElement("div");l.className="canopy-dob-parts";let i=document.createElement("input");i.type="hidden",i.id=n,i.name=e.name;let d=document.createElement("span");return d.className="canopy-error",d.id=`${n}-error`,Be.forEach(([c,m,u,h])=>{let s=document.createElement("div");s.className=`canopy-dob-part canopy-dob-part-${c}`;let p=`${n}-${c}`,y=document.createElement("label");y.className="canopy-dob-part-label",y.htmlFor=p,y.textContent=m;let b=document.createElement("input");b.type="text",b.className="canopy-input",b.id=p,b.name=`${e.name}.${c}`,b.maxLength=u,b.setAttribute("inputmode","numeric"),b.setAttribute("autocomplete",h),b.setAttribute("data-dob-part",c),b.setAttribute("data-dob-field",e.name),e.required&&b.setAttribute("aria-required","true"),b.addEventListener("input",()=>this.partsOf(e.name).forEach(f=>f.setCustomValidity(""))),s.appendChild(y),s.appendChild(b),l.appendChild(s)}),t.appendChild(l),A(t,a,d),t.appendChild(d),{wrapper:t,input:i,errorEl:d}}createPhoneField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field";let o=document.createElement("label");if(o.className="canopy-label",o.dataset.fieldPart="label",o.htmlFor=`${n}-number`,o.textContent=e.label||e.name,e.required){let u=document.createElement("span");u.className="canopy-required",u.textContent=" *",u.setAttribute("aria-hidden","true"),o.appendChild(u)}t.appendChild(o);let a=this.createHelpText(e,n);a&&t.appendChild(a);let l=document.createElement("input");l.type="hidden",l.id=n,l.name=e.name;let i=document.createElement("span");i.className="canopy-error",i.id=`${n}-error`;let d=document.createElement("div");d.className="canopy-phone-parts";let c=u=>{let h=document.createElement("input");return h.className="canopy-input",h.id=`${n}-${u}`,h.name=`${e.name}.${u}`,h.setAttribute("data-phone-field",e.name),h.setAttribute("data-phone-part",u),h.addEventListener("input",()=>this.partsOf(e.name).forEach(s=>s.setCustomValidity(""))),h},m=c("number");if(m.type="tel",m.maxLength=K,m.setAttribute("autocomplete","tel"),m.dataset.fieldPart="input",e.required&&m.setAttribute("aria-required","true"),A(m,a,i),d.appendChild(m),z(e.validation).includes("extension")){o.id=`${n}-label`,t.setAttribute("role","group"),t.setAttribute("aria-labelledby",o.id);let u=c("extension");u.type="text",u.maxLength=me,u.setAttribute("inputmode","numeric"),u.setAttribute("autocomplete","tel-extension"),A(u,null,i);let h=document.createElement("span");h.className="canopy-phone-extension";let s=document.createElement("label");s.className="canopy-phone-extension-label",s.dataset.fieldPart="label-extension",s.htmlFor=u.id,s.textContent=O(e.validation),h.append(s,u),d.appendChild(h)}return t.appendChild(d),t.appendChild(i),{wrapper:t,input:l,errorEl:i}}partsOf(e){return this.container.querySelectorAll(`input[data-name-field="${e}"], input[data-address-field="${e}"], select[data-address-field="${e}"], input[data-dob-field="${e}"], input[data-phone-field="${e}"]`)}collectValues(){let e={};return this.fieldElements.forEach((n,t)=>{var o;if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")e[t]=n.input.checked;else if(n.input.type==="hidden"){let a=this.container.querySelector(`[data-choice-group="${t}"]`),l=this.container.querySelectorAll(`input[data-dob-field="${t}"]`),i=this.container.querySelectorAll(`input[data-phone-field="${t}"]`);if(l.length>0)e[t]=Ve([...l]);else if(i.length>0)e[t]=Object.fromEntries([...i].map(d=>[d.dataset.phonePart,d.value]));else if(a){let d=[];a.querySelectorAll("input:checked").forEach(c=>{var u;if(c.value!==L){d.push(c.value);return}let m=(u=a.querySelector("[data-choice-other]"))==null?void 0:u.value.trim();m&&d.push(m)}),e[t]=a.hasAttribute("data-choice-one")?(o=d[0])!=null?o:"":d}else{let d=this.container.querySelectorAll(`input[data-name-field="${t}"]`);if(d.length>0){let c={};d.forEach(m=>{let u=m,h=u.getAttribute("data-name-part");h&&(c[h]=u.value)}),e[t]=c}else{let c=this.container.querySelectorAll(`input[data-address-field="${t}"], select[data-address-field="${t}"]`);if(c.length>0){let m={};c.forEach(u=>{let h=u.getAttribute("data-address-part");h&&(m[h]=u.value)}),e[t]=m}else e[t]=n.input.value}}}else e[t]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value===L&&n.input.__otherInput?e[t]=n.input.__otherInput.value:e[t]=n.input.value}),e}findFailingInput(e){var d;let n=[...this.container.querySelectorAll(`input[data-dob-field="${e}"]`)];if(n.length>0){let[c,,m]=n;return(d=n.find(u=>!u.value.trim()))!=null?d:/^\d{4}$/.test(m.value.trim())?c:m}let[t,o]=this.container.querySelectorAll(`input[data-phone-field="${e}"]`);if(t)return o!=null&&o.value.trim()&&Y(t.value)?o:t;let a=this.container.querySelectorAll(`input[data-name-field="${e}"]`),l=c=>c.getAttribute("aria-required")==="true"&&!c.value.trim()||c instanceof HTMLInputElement&&c.maxLength>0&&c.value.length>c.maxLength;if(a.length>0){for(let c of a)if(l(c))return c;return a[0]}let i=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(i.length>0){for(let c of i)if(l(c))return c;for(let c of i)if(c.getAttribute("data-address-part")==="postalCode")return c;return i[0]}return null}showErrors(e){this.fieldElements.forEach((t,o)=>{let a=e[o]||"";if(t.input.type==="hidden"){let l=this.container.querySelector(`[data-choice-group="${o}"]`);if(l){let i=l.querySelector("input");i&&i.setCustomValidity(a)}else{let i=a?this.findFailingInput(o):null;i?i.setCustomValidity(a):this.partsOf(o).forEach(d=>d.setCustomValidity(""))}}else t.input.setCustomValidity(a);t.errorEl.textContent=a,t.input.setAttribute("aria-invalid",a?"true":"false")});let n=Object.keys(e);if(n.length>0){let t=this.fieldElements.get(n[0]);if(t)if(t.input.type==="hidden"){let o=this.container.querySelector(`[data-choice-group="${n[0]}"]`);if(o){let a=o.querySelector("input");a&&(a.reportValidity(),a.focus())}else{let a=this.findFailingInput(n[0]);a&&(a.reportValidity(),a.focus())}}else t.input.reportValidity(),t.input.focus()}}setStatus(e,n){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(e){var o,a,l;if(e.preventDefault(),!this.formDefinition)return;this.setStatus("","info"),this.fieldElements.forEach((i,d)=>{if(i.input.setCustomValidity(""),i.input.type==="hidden"){let c=this.container.querySelector(`[data-choice-group="${d}"]`);if(c){let m=c.querySelector("input");m&&m.setCustomValidity("")}else this.partsOf(d).forEach(m=>m.setCustomValidity(""))}});let n=this.collectValues(),t=xe(this.formDefinition.fields,n);if(this.showErrors(t),Object.keys(t).length>0){let i=Object.keys(t).length;this.setStatus(`Please fix ${i} field${i>1?"s":""} to continue.`,"error");return}if(!this.options.preview){this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let i=this.options.baseUrl||"",d=this.options.formId||((o=this.formDefinition)==null?void 0:o.formId);if(!d){this.setStatus("Form configuration error.","error");return}let c=await fetch(`${i}/api/embed/${d}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),m=await c.json();if(!c.ok){m!=null&&m.fields&&this.showErrors(m.fields),this.setStatus((m==null?void 0:m.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}e.target.reset(),this.renderSuccess(this.formDefinition.successMessage||"Thanks for your submission!")}catch(i){console.error(i),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let i=((l=(a=this.formDefinition)==null?void 0:a.defaultTheme)==null?void 0:l.buttonText)||"Submit";this.submitButton.textContent=i,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}}renderSuccess(e){this.statusEl&&(this.statusEl.textContent="",this.statusEl.className="canopy-status"),this.formEl&&(this.formEl.style.display="none");let n=this.container.querySelector(".canopy-success");n&&n.remove();let t=document.createElement("div");t.className="canopy-success",t.setAttribute("role","status"),t.setAttribute("aria-live","polite");let o=document.createElement("div");o.className="canopy-success-icon",o.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',t.appendChild(o);let a=document.createElement("p");a.className="canopy-success-message",a.textContent=e,t.appendChild(a);let l=document.createElement("button");l.type="button",l.className="canopy-success-reset",l.textContent="Submit another response",l.addEventListener("click",()=>{this.formDefinition&&this.render(this.formDefinition)}),t.appendChild(l),this.container.appendChild(t)}renderSkeleton(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-skeleton";let n=[{labelW:"30%",type:"input"},{labelW:"45%",type:"input"},{labelW:"25%",type:"textarea"}],t=0,o=document.createElement("div");o.className="canopy-skeleton-bar canopy-skeleton-title",o.style.animationDelay=`${t}s`,e.appendChild(o),t+=.15;let a=document.createElement("div");a.className="canopy-skeleton-bar canopy-skeleton-desc",a.style.animationDelay=`${t}s`,e.appendChild(a),t+=.15;for(let i of n){let d=document.createElement("div");d.className="canopy-skeleton-field";let c=document.createElement("div");c.className="canopy-skeleton-bar canopy-skeleton-label",c.style.width=i.labelW,c.style.animationDelay=`${t}s`,d.appendChild(c),t+=.1;let m=document.createElement("div");m.className=`canopy-skeleton-bar canopy-skeleton-${i.type}`,m.style.animationDelay=`${t}s`,d.appendChild(m),t+=.15,e.appendChild(d)}let l=document.createElement("div");l.className="canopy-skeleton-bar canopy-skeleton-button",l.style.animationDelay=`${t}s`,e.appendChild(l),this.container.appendChild(e)}renderError(e){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=e,this.container.appendChild(n),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderInactive(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let n=document.createElement("h2");n.className="canopy-inactive-heading",n.textContent="Form Not Available",e.appendChild(n);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is not currently accepting responses. Please contact the form owner if you believe this is an error.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderHostedOnly(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let n=document.createElement("h2");n.className="canopy-inactive-heading",n.textContent="Form Not Available",e.appendChild(n);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is only available at its hosted URL and cannot be embedded. Please contact the form owner.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}};var ve=`
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

/* A box or radio button with its text: an Approval, or one of a choice's
   options. */
.canopy-choice {
  display: flex;
  align-items: center;
  gap: 8px;
}

.canopy-choices {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Two short answers, Yes and No most often, side by side. */
.canopy-choices-inline {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px 24px;
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
`;var Ae="canopy-embed-styles";function je(){if(document.getElementById(Ae))return;let r=document.createElement("style");r.id=Ae,r.textContent=ve,document.head.appendChild(r)}function Ge(r){var e;return r.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function Xe(r){let e=r.dataset.theme;if(e)try{return JSON.parse(e)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function Q(){je(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=e.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let t=Xe(e),o=Ge(e);new I(e,{formId:n,themeOverrides:t,baseUrl:o}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Q):Q();window.CanopyForms={init:Q,CanopyForm:I};})();
