"use strict";(()=>{var v={fontSize:16,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:4,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:28,titleWeight:"normal",titleAlign:"left",labelSize:18,labelWeight:"normal"},F=new Set;function C(r,e){if(!r)return e;let n=r.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:e:e}function Y(r){if(!r)return{};let{headingFont:e,...n}=r;return e?{titleFont:e,labelFont:e,...n}:n}function ee(r,e){return{...v,...Y(r),...Y(e)}}function ge(r){let e=/^#?([0-9a-f]{6})$/i.exec(r.trim());if(!e)return null;let n=parseInt(e[1],16);return[n>>16&255,n>>8&255,n&255]}function xe(r,e,n){let[t,o,a]=[r,e,n].map(c=>{let i=c/255;return i<=.03928?i/12.92:Math.pow((i+.055)/1.055,2.4)});return .2126*t+.7152*o+.0722*a}function J(r){let e=ge(r);return e?xe(...e):null}function Ee(r,e){let n=J(r);if(n===null||n<=.179)return"#ffffff";let t=J(e);return t!==null&&(n+.05)/(t+.05)>=4.5?e:v.text}function te(r,e){var u,s,d,g,l,p;let n=Q(e.bodyFont,e.fontFamily);r.style.setProperty("--canopy-font",n);for(let[h,y]of[["--canopy-title-font",e.titleFont],["--canopy-label-font",e.labelFont]]){let f=Q(y);r.style.setProperty(h,f==="inherit"?"var(--canopy-font)":f)}r.style.setProperty("--canopy-font-size",`${(u=e.fontSize)!=null?u:v.fontSize}px`);let t=C(e.text,v.text);r.style.setProperty("--canopy-text",t),r.style.setProperty("--canopy-bg",C(e.background,v.background)),r.style.setProperty("--canopy-field-bg",C(e.fieldBackground,v.fieldBackground));let o=C(e.primary,v.primary);r.style.setProperty("--canopy-primary",o),r.style.setProperty("--canopy-button-text",C(e.buttonTextColor,"")||Ee(o,t)),r.style.setProperty("--canopy-border",C(e.border,v.border)),r.style.setProperty("--canopy-radius",`${(s=e.radius)!=null?s:v.radius}px`),r.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),r.style.setProperty("--canopy-button-align",e.buttonAlign||v.buttonAlign);let a={sm:"1.25em",md:"1.5em",lg:"1.875em",xl:"2.25em"},c=(h,y)=>{var b;let f=Number(h);return f>0?`${f}px`:(b=a[String(h)])!=null?b:`${Number(y)}px`};r.style.setProperty("--canopy-title-size",c(e.titleSize,v.titleSize)),r.style.setProperty("--canopy-label-size",c(e.labelSize,v.labelSize));let i={light:"300",normal:"400",medium:"500",bold:"700",semibold:"700"};r.style.setProperty("--canopy-title-weight",(g=i[(d=e.titleWeight)!=null?d:"normal"])!=null?g:"400"),r.style.setProperty("--canopy-label-weight",(p=i[(l=e.labelWeight)!=null?l:"normal"])!=null?p:"400");for(let[h,y]of[["--canopy-title-color",e.titleColor],["--canopy-label-color",e.labelColor]]){let f=y?C(y,""):"";f?r.style.setProperty(h,f):r.style.removeProperty(h)}r.style.setProperty("--canopy-title-align",e.titleAlign==="center"?"center":"left")}function ne(r){switch(r.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function Q(r,e){return r&&r!=="inherit"?`'${r}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function re(r,e){let n=r.filter(c=>!!c&&c!=="inherit"&&!F.has(c));if(n.length===0)return;let t=n.map(c=>`family=${encodeURIComponent(c)}`).join("&"),o=`${e}/api/fonts?${t}`,a=document.createElement("link");a.rel="stylesheet",a.href=o,a.dataset.canopyFont="true",document.head.appendChild(a),n.forEach(c=>F.add(c))}function ae(r){if(!r||F.has(r))return;let e=document.createElement("link");e.rel="stylesheet",e.href=r,e.dataset.canopyFont="true",document.head.appendChild(e),F.add(r)}var W="Name",ve={first:"First",middle:"Middle",middleInitial:"M.I.",last:"Last",single:W},N=["first","last"],oe=["first","middle","middleInitial","last","single"];function ie(r){return[...r].sort((e,n)=>oe.indexOf(e)-oe.indexOf(n))}function D(r,e){var t;if(r!=null&&r.requiredParts)return r.requiredParts;let n=(t=r==null?void 0:r.parts)!=null?t:N;return e?n.filter(o=>o!=="middle"&&o!=="middleInitial"):[]}function H(r){return r==="middleInitial"?2:100}function R(r,e){return(e==null?void 0:e[r])||ve[r]||r}var Ae={line1:"Street",line2:"Apt, suite",city:"City",region:"State",postalCode:"ZIP"},se=["line1","line2","city","region","postalCode"];function L(r){var n;let e=(n=r==null?void 0:r.parts)!=null?n:se;return se.filter(t=>e.includes(t))}function T(r,e){return(e==null?void 0:e[r])||Ae[r]||r}function V(r,e){return r!=null&&r.requiredParts?r.requiredParts:e?L(r).filter(n=>n!=="line2"):[]}var q=200,Ce=/^\d{5}(-\d{4})?$/;function le(r,e,n){let t=L(e),o=V(e,n),a=i=>{var u;return String((u=r==null?void 0:r[i])!=null?u:"")},c=i=>a(i).trim();for(let i of t){if(o.includes(i)&&!c(i))return`${T(i,e==null?void 0:e.partLabels)} is required.`;if(a(i).length>q)return`${T(i,e==null?void 0:e.partLabels)} must be at most ${q} characters.`}return t.includes("postalCode")&&c("postalCode")&&!Ce.test(c("postalCode"))?`${T("postalCode",e==null?void 0:e.partLabels)} must be a US ZIP code, like 12345 or 12345-6789.`:null}var U="Choose one...",_="Other",$="__other__";function z(r){let e=Array.isArray(r)?r:r==null?void 0:r.options;return Array.isArray(e)?e.filter(n=>typeof n=="object"&&n!==null&&typeof n.value=="string"):[]}function B(r){return!Array.isArray(r)&&(r==null?void 0:r.allowOther)===!0}function j(r,e,n,t){let o=r==="CHECKBOXES"?e:typeof e=="string"?[e]:null;if(!Array.isArray(o)||o.some(i=>typeof i!="string"))return`${t} must be one of its options.`;if(new Set(o).size<o.length)return`${t} picks an option more than once.`;let a=z(n).map(i=>i.value),c=o.filter(i=>!a.includes(i));return c.length===0?null:!B(n)||c.length>1?`${t} must be one of its options.`:c[0].length>200?`${t} must be 200 characters or fewer.`:null}var de={TEXT:200,EMAIL:254,TEXTAREA:2e3},Te={TEXT:500,EMAIL:320,TEXTAREA:1e4,PHONE:30,NUMBER:50,DATE:30,DATE_OF_BIRTH:10};function G(r){return typeof r.validation=="object"&&r.validation!==null?r.validation:{}}function S(r){let e=de[r.type],n=Te[r.type];if(e===void 0)return n;let t=G(r).maxLength,o=Number.isInteger(t)&&t>0?t:e;return n!==void 0?Math.min(o,n):o}var we=/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;function Le(r){return r.length>320||/[\r\n]/.test(r)?!1:we.test(r)}function $e(r){let e=r.replace(/[^\d+]/g,"");if(e.startsWith("+1"))e=e.substring(2);else{if(e.startsWith("+"))return null;e.startsWith("1")&&e.length===11&&(e=e.substring(1))}return/^\d{10}$/.test(e)?e:null}function O(r=new Date){let e=(n,t=2)=>String(n).padStart(t,"0");return`${e(r.getFullYear(),4)}-${e(r.getMonth()+1)}-${e(r.getDate())}`}function ue(){let r=O();return{earliest:r,latest:r}}function me(r){if(/^\d{4}-\d{2}-\d{2}$/.test(r)){let n=new Date(`${r}T00:00:00Z`);return!isNaN(n.getTime())&&n.toISOString().slice(0,10)===r?r:null}let e=new Date(r);return isNaN(e.getTime())?null:O(e)}function ke(r){let e=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(r);return e?me(`${e[1]}-${e[2].padStart(2,"0")}-${e[3].padStart(2,"0")}`):null}function Ne(r){let e=String(r).replace(/[,\s]/g,"");return/^-?(\d+\.?\d*|\.\d+)$/.test(e)?e:null}function X(r,e,n){return e!==void 0&&r.length>e?`${n} must be at most ${e} characters.`:null}function ce(r,e,n){let{minLength:t}=G(r);return t&&e.length<t?`${n} must be at least ${t} characters.`:X(e,S(r),n)}function Se(r,e,n){switch(r){case"numbers":return/^\d+$/.test(e)?null:`${n} must contain only numbers.`;case"letters":return/^[A-Za-z]+$/.test(e)?null:`${n} must contain only letters.`;case"url":{try{if(new URL(e.startsWith("http")?e:`https://${e}`).hostname.includes("."))return null}catch(t){}return`${n} must be a valid URL.`}case"postal-us":return/^\d{5}(-\d{4})?$/.test(e)?null:`${n} must be a valid US postal code (e.g., 12345 or 12345-6789).`;case"postal-ca":return/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(e)?null:`${n} must be a valid Canadian postal code (e.g., K1A 0B1).`;default:return null}}function pe(r,e,n,t){if(r==null)return null;if(typeof r!="object"||Array.isArray(r))return`${t} must be an object of its parts.`;for(let[o,a]of Object.entries(r)){if(!e.includes(o))return`${t} has no part "${o}".`;if(typeof a!="string")return`${n(o)} must be text.`}return null}function Oe(r,e,n=ue()){var c,i,u;let t=r.label||r.name,o=G(r);switch(r.type){case"CHECKBOX":return e!=null&&typeof e!="boolean"&&e!=="on"?`${t} must be true or false.`:r.required&&!e?`${t} is required.`:null;case"CHECKBOXES":if(!Array.isArray(e)||e.length===0){if(r.required)return`${t} is required.`;if(e==null||Array.isArray(e))return null}return j("CHECKBOXES",e,r.options,t);case"NAME":{let s=typeof r.options=="object"&&r.options!==null?r.options:{},d=s.parts||N,g=y=>y==="single"?t:R(y,s.partLabels),l=pe(e,d,g,t);if(l)return l;let p=e,h=D(s,r.required);for(let y of d){let f=p==null?void 0:p[y],b=g(y);if(h.includes(y)&&(!f||String(f).trim()===""))return`${b} is required.`;let m=X(String(f!=null?f:""),H(y),b);if(m)return m}return null}case"ADDRESS":{let s=r.options,d=g=>T(g,s==null?void 0:s.partLabels);return(c=pe(e,L(s),d,t))!=null?c:le(e,s,r.required)}}if(e==null)return r.required?`${t} is required.`:null;if(typeof e!="string"&&!(r.type==="NUMBER"&&typeof e=="number"))return r.type==="NUMBER"?`${t} must be a number.`:`${t} must be text.`;let a=String(e);if(a.trim()==="")return r.required?`${t} is required.`:null;if(de[r.type]===void 0){let s=X(a,S(r),t);if(s)return s}switch(r.type){case"DROPDOWN":return j("DROPDOWN",e,r.options,t);case"PHONE":{let s=o.format||"lenient";return s==="lenient"&&!/^[\d\s\-\(\)\+\.]{7,}$/.test(a)?`${t} must be a valid phone number.`:s==="strict"&&!$e(a)?`${t} must be a valid US phone number (10 digits).`:null}case"DATE":{let s=me(a);return s?o.minDate==="today"&&s<n.earliest?`${t} must be today or in the future.`:o.maxDate==="today"&&s>n.latest?`${t} must be today or in the past.`:null:`${t} must be a real date.`}case"DATE_OF_BIRTH":{let[s="",d="",g=""]=a.split("-");if(!d.trim())return`${t} must include a month.`;if(!g.trim())return`${t} must include a day.`;if(!s.trim())return`${t} must include a year.`;if(!/^\d{4}$/.test(s))return"Year must include 4 numbers.";let l=ke(a);return l?l>=n.latest?`${t} must be in the past.`:null:`${t} must be a real date.`}case"NUMBER":{let{min:s,max:d,integer:g}=o,l=Math.min(Math.max(10,s!=null?s:-1/0),d!=null?d:1/0),p=Ne(e);if(p===null)return`${t} must be a ${g?"whole ":""}number, like ${l}.`;let h=Number(p);return g&&!Number.isInteger(h)?`${t} must be a whole number, like ${l}.`:s!==void 0&&h<s||d!==void 0&&h>d?s!==void 0&&d!==void 0?`${t} must be between ${s} and ${d}.`:s!==void 0?`${t} must be ${s} or more.`:`${t} must be ${d} or ${g?"fewer":"less"}.`:null}case"EMAIL":{let s=a.trim();if(!Le(s))return"Enter a valid email address";let d=s.split("@")[1].toLowerCase(),{allow:g,block:l}=(i=o.domainRules)!=null?i:{};return Array.isArray(g)&&g.length>0&&!g.some(p=>String(p).toLowerCase()===d)?`${t} must be from an allowed domain.`:Array.isArray(l)&&l.some(p=>String(p).toLowerCase()===d)?`${t} domain is not allowed.`:ce(r,s,t)}default:return(u=ce(r,a,t))!=null?u:Se(o.format,a,t)}}function ye(r,e,n=ue()){let t={};for(let o of r){let a=Oe(o,Me(e,o.name),n);a&&(t[o.name]=a)}return t}function Me(r,e){return Object.prototype.hasOwnProperty.call(r,e)?r[e]:void 0}var fe=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var Pe={single:"name",first:"given-name",middle:"additional-name",last:"family-name"},Fe={line1:"address-line1",line2:"address-line2",city:"address-level2",region:"address-level1",postalCode:"postal-code"},De=[["month","Month",2,"bday-month"],["day","Day",2,"bday-day"],["year","Year",4,"bday-year"]],He=r=>{let[e,n,t]=r.map(a=>a.value.trim());if(!e&&!n&&!t)return"";let o=a=>/^\d$/.test(a)?`0${a}`:a;return`${t}-${o(e)}-${o(n)}`},k=(r,e,n)=>r.setAttribute("aria-describedby",e?`${e.id} ${n.id}`:n.id),Re="feedback@canopyds.com",qe=0,M=class extends Error{constructor(e){super(e),this.name="InactiveFormError"}},I=class extends Error{constructor(e){super(e),this.name="HostedOnlyFormError"}},P=class{constructor(e,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.formEl=null;this.submitButton=null;this.instanceId=`canopy-${qe++}`;this.container=e,this.options=n}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){if(console.error(e),e instanceof M){this.renderInactive();return}if(e instanceof I){this.renderHostedOnly();return}this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var o;let e=this.options.baseUrl||"",n=this.options.formId||((o=this.formDefinition)==null?void 0:o.formId);if(!n)throw new Error("Form configuration error: no formId");let t=await fetch(`${e}/api/embed/${n}`,{method:"GET",credentials:"omit"});if(!t.ok){if(t.status===403)try{let a=await t.json();if((a==null?void 0:a.code)==="FORM_INACTIVE")throw new M(a.error||"Form is inactive");if((a==null?void 0:a.code)==="FORM_HOSTED_ONLY")throw new I(a.error||"Form is only available at its hosted URL")}catch(a){if(a instanceof M||a instanceof I)throw a}throw new Error("Failed to load form definition")}return t.json()}renderFromDefinition(e){this.container.classList.add("canopy-root"),this.formDefinition=e,this.render(e)}render(e){this.container.innerHTML="",this.fieldElements.clear();let n=ee(e.defaultTheme,this.options.themeOverrides);te(this.container,n),re([n.bodyFont,n.titleFont,n.labelFont],this.options.baseUrl||""),!n.bodyFont&&!n.titleFont&&!n.labelFont&&ae(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(ne(n));let t=e.fields&&e.fields.length>0,o=e.title||e.description;if(!t&&!o){this.renderSkeleton();return}if(e.title||e.description){let h=document.createElement("div");if(h.className="canopy-header",e.title){let y=document.createElement("h2");y.className="canopy-title",y.textContent=e.title,h.appendChild(y)}if(e.description){let y=document.createElement("p");y.className="canopy-description",y.textContent=e.description,h.appendChild(y)}this.container.appendChild(h)}let a=document.createElement("div");a.className="canopy-status",a.setAttribute("role","alert"),a.setAttribute("aria-live","assertive"),this.statusEl=a;let c=document.createElement("form");c.className="canopy-form",c.addEventListener("submit",h=>this.handleSubmit(h)),this.formEl=c,e.fields.forEach(h=>{let{wrapper:y,input:f,errorEl:b}=this.createField(h);y&&(y.dataset.fieldName=h.name,c.appendChild(y)),this.fieldElements.set(h.name,{input:f,errorEl:b})}),this.options.preview&&(c.setAttribute("autocomplete","off"),c.querySelectorAll("input, select, textarea").forEach(h=>h.setAttribute("autocomplete","off")));let i=document.createElement("button");i.type="submit",i.className="canopy-submit",i.textContent=n.buttonText||"Submit",this.options.preview&&(i.classList.add("canopy-submit-preview"),i.setAttribute("data-preview-tooltip","For preview only. No submission will be created"));let u=getComputedStyle(this.container),s=u.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",d=u.getPropertyValue("--canopy-button-text").trim()||"#ffffff",g=u.getPropertyValue("--canopy-radius").trim()||"8px",l=u.getPropertyValue("--canopy-button-width").trim()||"100%";i.style.cssText=`
      display: block !important;
      width: ${l} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${g} !important;
      padding: 10px 16px !important;
      font-family: var(--canopy-font, inherit) !important;
      font-size: var(--canopy-font-size, 16px) !important;
      font-weight: 600 !important;
      background: ${s} !important;
      background-color: ${s} !important;
      color: ${d} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=i;let p=document.createElement("div");p.className="canopy-form-actions",p.appendChild(i),c.appendChild(p),this.container.appendChild(a),this.container.appendChild(c),this.container.appendChild(this.renderWatermark(e))}renderWatermark(e){let n=document.createElement("div");n.className="canopy-watermark";let t=document.createElement("span");t.className="canopy-watermark-brand",t.textContent="Powered by Canopy Forms (Beta)",n.appendChild(t);let o=document.createElement("span");o.className="canopy-watermark-sep",o.setAttribute("aria-hidden","true"),o.textContent="\xB7",n.appendChild(o);let a=(e==null?void 0:e.title)||(e==null?void 0:e.name)||(e==null?void 0:e.formId)||"unknown form",c=(e==null?void 0:e.formId)||"unknown",i=`Canopy Forms issue \u2014 ${a}`,u=[`Form: ${a}`,`Form ID: ${c}`,"","Describe the issue:",""].join(`
`),s=`mailto:${Re}?subject=${encodeURIComponent(i)}&body=${encodeURIComponent(u)}`,d=document.createElement("a");return d.className="canopy-watermark-link",d.href=s,d.textContent="Report an issue",d.rel="noopener",n.appendChild(d),n}createField(e){var s,d,g;let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field";let o=document.createElement("label");if(o.className="canopy-label",o.dataset.fieldPart="label",o.htmlFor=n,o.textContent=e.label||e.name,e.required){let l=document.createElement("span");l.className="canopy-required",l.textContent=" *",l.setAttribute("aria-hidden","true"),o.appendChild(l)}let a;switch(e.type){case"TEXTAREA":{let l=document.createElement("textarea");l.className="canopy-textarea";let p=S(e);if(p){let h=Math.min(Math.max(Math.ceil(p/60),4),15);l.rows=h}else l.rows=4;a=l;break}case"DROPDOWN":{let l=z(e.options),p=Array.isArray(e.options)||(s=e.options)==null?void 0:s.defaultValue,h=l.some(m=>m.value===p),y=B(e.options),f=document.createElement("select");f.className="canopy-select";let b=document.createElement("option");if(b.value="",b.textContent=U,b.disabled=!0,b.selected=!h,f.appendChild(b),l.forEach(m=>{let x=document.createElement("option");x.value=m.value,x.textContent=m.label,h&&m.value===p&&(x.selected=!0),f.appendChild(x)}),y){let m=document.createElement("option");m.value=$,m.textContent=_,f.appendChild(m)}if(a=f,y){let m=this.createOtherInput(e);f.addEventListener("change",()=>{f.value===$?(m.style.setProperty("display","block","important"),e.required&&(m.required=!0)):(m.style.setProperty("display","none","important"),m.required=!1,m.value="")}),f.__otherInput=m}break}case"CHECKBOX":{let l=document.createElement("label");l.className="canopy-checkbox";let p=document.createElement("input");p.type="checkbox",p.id=n,p.name=e.name,e.required&&p.setAttribute("aria-required","true"),p.addEventListener("change",()=>{p.setCustomValidity("")}),l.appendChild(p);let h=document.createElement("span");h.dataset.fieldPart="label",h.textContent=e.label||e.name,l.appendChild(h),t.appendChild(l);let y=this.createHelpText(e,n);y&&t.appendChild(y);let f=document.createElement("span");return f.className="canopy-error",f.id=`${n}-error`,t.appendChild(f),k(p,y,f),p.setAttribute("aria-invalid","false"),{wrapper:t,input:p,errorEl:f}}case"CHECKBOXES":{let l=document.createElement("div");l.className="canopy-checkboxes",l.setAttribute("data-checkbox-group",e.name);let p=()=>{let m=l.querySelector("input[type=checkbox]");m&&m.setCustomValidity("")},h=(m,x,E)=>{let A=document.createElement("label");A.className="canopy-checkbox",A.dataset.fieldPart=E;let w=document.createElement("input");w.type="checkbox",w.name=e.name,w.value=m,w.addEventListener("change",p);let Z=document.createElement("span");return Z.textContent=x,A.appendChild(w),A.appendChild(Z),l.appendChild(A),w};if(z(e.options).forEach((m,x)=>{h(m.value,m.label,`option-${x}`)}),B(e.options)){let m=h($,_,"option-other"),x=this.createOtherInput(e);x.dataset.choiceOther=e.name,x.addEventListener("input",p),m.addEventListener("change",()=>{m.checked?(x.style.setProperty("display","block","important"),x.focus()):(x.style.setProperty("display","none","important"),x.value="")}),l.appendChild(x)}let y=document.createElement("input");y.type="hidden",y.id=n,y.name=e.name,o.id=`${n}-label`,l.setAttribute("role","group"),l.setAttribute("aria-labelledby",o.id);let f=this.createHelpText(e,n);t.appendChild(o),f&&t.appendChild(f),t.appendChild(l);let b=document.createElement("span");return b.className="canopy-error",b.id=`${n}-error`,t.appendChild(b),k(l,f,b),y.setAttribute("aria-invalid","false"),{wrapper:t,input:y,errorEl:b}}case"EMAIL":{let l=document.createElement("input");l.type="email",l.setAttribute("autocomplete","email"),l.className="canopy-input",a=l;break}case"PHONE":{let l=document.createElement("input");l.type="tel",l.setAttribute("inputmode","tel"),l.setAttribute("autocomplete","tel"),l.className="canopy-input",a=l;break}case"DATE":{let l=document.createElement("input");l.type="date",l.className="canopy-input",((d=e.validation)==null?void 0:d.minDate)==="today"&&(l.min=O()),((g=e.validation)==null?void 0:g.maxDate)==="today"&&(l.max=O()),a=l;break}case"NUMBER":{let l=document.createElement("input");l.type="text",l.className="canopy-input",l.spellcheck=!1;let p=e.validation;(p==null?void 0:p.min)!==void 0&&p.min<0||l.setAttribute("inputmode",p!=null&&p.integer?"numeric":"decimal"),a=l;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);case"DATE_OF_BIRTH":return this.createDateOfBirthField(e);default:{let l=document.createElement("input");l.type="text",l.className="canopy-input",a=l}}a.id=n,a.name=e.name,a.dataset.fieldPart="input",a.setAttribute("aria-invalid","false"),e.required&&a.setAttribute("aria-required","true");let c=S(e);c&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=c),a.addEventListener("input",()=>{a.setCustomValidity("")});let i=document.createElement("span");i.className="canopy-error",i.id=`${n}-error`;let u=this.createHelpText(e,n);return t.appendChild(o),u&&t.appendChild(u),t.appendChild(a),k(a,u,i),a.__otherInput&&t.appendChild(a.__otherInput),t.appendChild(i),{wrapper:t,input:a,errorEl:i}}createHelpText(e,n){if(!e.helpText)return null;let t=document.createElement("p");return t.className="canopy-help-text",t.id=`${n}-help`,t.textContent=e.helpText,t}createOtherInput(e){let n=document.createElement("input");return n.type="text",n.className="canopy-input canopy-choice-other",n.name=`${e.name}_other`,n.placeholder="Please specify...",n.maxLength=200,n.setAttribute("aria-label",`${e.label||e.name}: ${_}`),n.style.setProperty("display","none","important"),n.addEventListener("input",()=>{n.setCustomValidity("")}),n}createNameField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-name-group",t.setAttribute("role","group");let o=e.options||{},a=ie(o.parts||N),c=D(o,e.required),i=e.label||W,u=a.includes("single"),s=this.createHelpText(e,n);if(u)t.setAttribute("aria-label",i);else{let p=document.createElement("span");p.id=`${n}-group-label`,p.className="canopy-label",p.dataset.fieldPart="label",p.textContent=i,t.appendChild(p),s&&t.appendChild(s),t.setAttribute("aria-labelledby",p.id)}let d=document.createElement("div");d.className="canopy-name-parts";let g=document.createElement("input");g.type="hidden",g.id=n,g.name=e.name;let l=document.createElement("span");return l.className="canopy-error",l.id=`${n}-error`,a.forEach(p=>{let h=document.createElement("div");h.className=p==="middleInitial"?"canopy-name-part canopy-name-part-initial":"canopy-name-part";let y=document.createElement("label");y.className=u?"canopy-label":"canopy-name-part-label";let f=`${n}-${p}`;y.htmlFor=f,y.textContent=u?i:R(p,o.partLabels),y.dataset.fieldPart=u?"label":`label-${p}`;let b=c.includes(p);if(b){let E=document.createElement("span");E.className="canopy-required",E.textContent=" *",E.setAttribute("aria-hidden","true"),y.appendChild(E)}let m=document.createElement("input");m.type="text",m.className="canopy-input",m.id=f,m.name=`${e.name}.${p}`,m.setAttribute("data-name-part",p),m.setAttribute("data-name-field",e.name),m.maxLength=H(p);let x=Pe[p];x&&m.setAttribute("autocomplete",x),b&&m.setAttribute("aria-required","true"),m.addEventListener("input",()=>{d.querySelectorAll("input[data-name-part]").forEach(E=>E.setCustomValidity(""))}),h.appendChild(y),u&&s&&h.appendChild(s),h.appendChild(m),d.appendChild(h)}),t.appendChild(d),k(t,s,l),t.appendChild(l),{wrapper:t,input:g,errorEl:l}}createAddressField(e){let n=`${this.instanceId}-${e.name}`,t=e.options||{},o=document.createElement("div");o.className="canopy-field canopy-address-group",o.setAttribute("role","group"),o.setAttribute("aria-labelledby",`${n}-group-label`);let a=document.createElement("span");a.id=`${n}-group-label`,a.className="canopy-label",a.dataset.fieldPart="label",a.textContent=e.label||"Address",o.appendChild(a);let c=this.createHelpText(e,n);c&&o.appendChild(c);let i=document.createElement("div");i.className="canopy-address-parts";let u=document.createElement("input");u.type="hidden",u.id=n,u.name=e.name;let s=document.createElement("span");s.className="canopy-error",s.id=`${n}-error`;let d={postalCode:{maxlength:"10",inputmode:"numeric"}},g=V(t,e.required);return L(t).forEach(l=>{let p=g.includes(l),h=document.createElement("div");h.className=`canopy-address-part canopy-address-part-${l}`;let y=document.createElement("label");y.className="canopy-address-part-label";let f=`${n}-${l}`;if(y.htmlFor=f,y.textContent=T(l,t.partLabels),y.dataset.fieldPart=`label-${l}`,p){let m=document.createElement("span");m.className="canopy-required",m.textContent=" *",m.setAttribute("aria-hidden","true"),y.appendChild(m)}let b;if(l==="region"){let m=document.createElement("select");m.className="canopy-select";let x=document.createElement("option");x.value="",x.textContent=U,m.appendChild(x),fe.forEach(E=>{let A=document.createElement("option");A.value=E.value,A.textContent=E.label,m.appendChild(A)}),m.addEventListener("change",()=>{i.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(E=>E.setCustomValidity(""))}),b=m}else{let m=document.createElement("input");m.type="text",m.className="canopy-input",m.maxLength=q,d[l]&&Object.entries(d[l]).forEach(([x,E])=>m.setAttribute(x,E)),m.addEventListener("input",()=>{i.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(x=>x.setCustomValidity(""))}),b=m}b.id=f,b.setAttribute("autocomplete",Fe[l]),b.setAttribute("data-address-part",l),b.setAttribute("data-address-field",e.name),p&&b.setAttribute("aria-required","true"),h.appendChild(y),h.appendChild(b),i.appendChild(h)}),o.appendChild(i),k(o,c,s),o.appendChild(s),{wrapper:o,input:u,errorEl:s}}createDateOfBirthField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-dob-group",t.setAttribute("role","group");let o=document.createElement("span");if(o.id=`${n}-group-label`,o.className="canopy-label",o.dataset.fieldPart="label",o.textContent=e.label||e.name,e.required){let s=document.createElement("span");s.className="canopy-required",s.textContent=" *",s.setAttribute("aria-hidden","true"),o.appendChild(s)}t.appendChild(o),t.setAttribute("aria-labelledby",o.id);let a=this.createHelpText(e,n);a&&t.appendChild(a);let c=document.createElement("div");c.className="canopy-dob-parts";let i=document.createElement("input");i.type="hidden",i.id=n,i.name=e.name;let u=document.createElement("span");return u.className="canopy-error",u.id=`${n}-error`,De.forEach(([s,d,g,l])=>{let p=document.createElement("div");p.className=`canopy-dob-part canopy-dob-part-${s}`;let h=`${n}-${s}`,y=document.createElement("label");y.className="canopy-dob-part-label",y.htmlFor=h,y.textContent=d;let f=document.createElement("input");f.type="text",f.className="canopy-input",f.id=h,f.name=`${e.name}.${s}`,f.maxLength=g,f.setAttribute("inputmode","numeric"),f.setAttribute("autocomplete",l),f.setAttribute("data-dob-part",s),f.setAttribute("data-dob-field",e.name),e.required&&f.setAttribute("aria-required","true"),f.addEventListener("input",()=>this.partsOf(e.name).forEach(b=>b.setCustomValidity(""))),p.appendChild(y),p.appendChild(f),c.appendChild(p)}),t.appendChild(c),k(t,a,u),t.appendChild(u),{wrapper:t,input:i,errorEl:u}}partsOf(e){return this.container.querySelectorAll(`input[data-name-field="${e}"], input[data-address-field="${e}"], select[data-address-field="${e}"], input[data-dob-field="${e}"]`)}collectValues(){let e={};return this.fieldElements.forEach((n,t)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")e[t]=n.input.checked;else if(n.input.type==="hidden"){let o=this.container.querySelector(`[data-checkbox-group="${t}"]`),a=this.container.querySelectorAll(`input[data-dob-field="${t}"]`);if(a.length>0)e[t]=He([...a]);else if(o){let c=[];o.querySelectorAll("input[type=checkbox]:checked").forEach(i=>{var s;if(i.value!==$){c.push(i.value);return}let u=(s=o.querySelector("[data-choice-other]"))==null?void 0:s.value.trim();u&&c.push(u)}),e[t]=c}else{let c=this.container.querySelectorAll(`input[data-name-field="${t}"]`);if(c.length>0){let i={};c.forEach(u=>{let s=u,d=s.getAttribute("data-name-part");d&&(i[d]=s.value)}),e[t]=i}else{let i=this.container.querySelectorAll(`input[data-address-field="${t}"], select[data-address-field="${t}"]`);if(i.length>0){let u={};i.forEach(s=>{let d=s.getAttribute("data-address-part");d&&(u[d]=s.value)}),e[t]=u}else e[t]=n.input.value}}}else e[t]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value===$&&n.input.__otherInput?e[t]=n.input.__otherInput.value:e[t]=n.input.value}),e}findFailingInput(e){var c;let n=[...this.container.querySelectorAll(`input[data-dob-field="${e}"]`)];if(n.length>0){let[i,,u]=n;return(c=n.find(s=>!s.value.trim()))!=null?c:/^\d{4}$/.test(u.value.trim())?i:u}let t=this.container.querySelectorAll(`input[data-name-field="${e}"]`),o=i=>i.getAttribute("aria-required")==="true"&&!i.value.trim()||i instanceof HTMLInputElement&&i.maxLength>0&&i.value.length>i.maxLength;if(t.length>0){for(let i of t)if(o(i))return i;return t[0]}let a=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(a.length>0){for(let i of a)if(o(i))return i;for(let i of a)if(i.getAttribute("data-address-part")==="postalCode")return i;return a[0]}return null}showErrors(e){this.fieldElements.forEach((t,o)=>{let a=e[o]||"";if(t.input.type==="hidden"){let c=this.container.querySelector(`[data-checkbox-group="${o}"]`);if(c){let i=c.querySelector("input[type=checkbox]");i&&i.setCustomValidity(a)}else{let i=a?this.findFailingInput(o):null;i?i.setCustomValidity(a):this.partsOf(o).forEach(u=>u.setCustomValidity(""))}}else t.input.setCustomValidity(a);t.errorEl.textContent=a,t.input.setAttribute("aria-invalid",a?"true":"false")});let n=Object.keys(e);if(n.length>0){let t=this.fieldElements.get(n[0]);if(t)if(t.input.type==="hidden"){let o=this.container.querySelector(`[data-checkbox-group="${n[0]}"]`);if(o){let a=o.querySelector("input[type=checkbox]");a&&(a.reportValidity(),a.focus())}else{let a=this.findFailingInput(n[0]);a&&(a.reportValidity(),a.focus())}}else t.input.reportValidity(),t.input.focus()}}setStatus(e,n){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(e){var o,a,c;if(e.preventDefault(),!this.formDefinition||this.options.preview)return;this.setStatus("","info"),this.fieldElements.forEach((i,u)=>{if(i.input.setCustomValidity(""),i.input.type==="hidden"){let s=this.container.querySelector(`[data-checkbox-group="${u}"]`);if(s){let d=s.querySelector("input[type=checkbox]");d&&d.setCustomValidity("")}else this.partsOf(u).forEach(d=>d.setCustomValidity(""))}});let n=this.collectValues(),t=ye(this.formDefinition.fields,n);if(this.showErrors(t),Object.keys(t).length>0){let i=Object.keys(t).length;this.setStatus(`Please fix ${i} field${i>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let i=this.options.baseUrl||"",u=this.options.formId||((o=this.formDefinition)==null?void 0:o.formId);if(!u){this.setStatus("Form configuration error.","error");return}let s=await fetch(`${i}/api/embed/${u}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),d=await s.json();if(!s.ok){d!=null&&d.fields&&this.showErrors(d.fields),this.setStatus((d==null?void 0:d.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}e.target.reset(),this.renderSuccess(this.formDefinition.successMessage||"Thanks for your submission!")}catch(i){console.error(i),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let i=((c=(a=this.formDefinition)==null?void 0:a.defaultTheme)==null?void 0:c.buttonText)||"Submit";this.submitButton.textContent=i,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderSuccess(e){this.statusEl&&(this.statusEl.textContent="",this.statusEl.className="canopy-status"),this.formEl&&(this.formEl.style.display="none");let n=this.container.querySelector(".canopy-success");n&&n.remove();let t=document.createElement("div");t.className="canopy-success",t.setAttribute("role","status"),t.setAttribute("aria-live","polite");let o=document.createElement("div");o.className="canopy-success-icon",o.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',t.appendChild(o);let a=document.createElement("p");a.className="canopy-success-message",a.textContent=e,t.appendChild(a);let c=document.createElement("button");c.type="button",c.className="canopy-success-reset",c.textContent="Submit another response",c.addEventListener("click",()=>{this.formDefinition&&this.render(this.formDefinition)}),t.appendChild(c),this.container.appendChild(t)}renderSkeleton(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-skeleton";let n=[{labelW:"30%",type:"input"},{labelW:"45%",type:"input"},{labelW:"25%",type:"textarea"}],t=0,o=document.createElement("div");o.className="canopy-skeleton-bar canopy-skeleton-title",o.style.animationDelay=`${t}s`,e.appendChild(o),t+=.15;let a=document.createElement("div");a.className="canopy-skeleton-bar canopy-skeleton-desc",a.style.animationDelay=`${t}s`,e.appendChild(a),t+=.15;for(let i of n){let u=document.createElement("div");u.className="canopy-skeleton-field";let s=document.createElement("div");s.className="canopy-skeleton-bar canopy-skeleton-label",s.style.width=i.labelW,s.style.animationDelay=`${t}s`,u.appendChild(s),t+=.1;let d=document.createElement("div");d.className=`canopy-skeleton-bar canopy-skeleton-${i.type}`,d.style.animationDelay=`${t}s`,u.appendChild(d),t+=.15,e.appendChild(u)}let c=document.createElement("div");c.className="canopy-skeleton-bar canopy-skeleton-button",c.style.animationDelay=`${t}s`,e.appendChild(c),this.container.appendChild(e)}renderError(e){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=e,this.container.appendChild(n),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderInactive(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let n=document.createElement("h2");n.className="canopy-inactive-heading",n.textContent="Form Not Available",e.appendChild(n);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is not currently accepting responses. Please contact the form owner if you believe this is an error.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderHostedOnly(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let n=document.createElement("h2");n.className="canopy-inactive-heading",n.textContent="Form Not Available",e.appendChild(n);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is only available at its hosted URL and cannot be embedded. Please contact the form owner.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}};var he=`
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

.canopy-error {
  /* Hidden - using native HTML5 validation popups instead */
  /* Keep in DOM for screen reader accessibility */
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
`;var be="canopy-embed-styles";function _e(){if(document.getElementById(be))return;let r=document.createElement("style");r.id=be,r.textContent=he,document.head.appendChild(r)}function ze(r){var e;return r.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function Be(r){let e=r.dataset.theme;if(e)try{return JSON.parse(e)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function K(){_e(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=e.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let t=Be(e),o=ze(e);new P(e,{formId:n,themeOverrides:t,baseUrl:o}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",K):K();window.CanopyForms={init:K,CanopyForm:P};})();
