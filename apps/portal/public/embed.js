"use strict";(()=>{var A={fontSize:16,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:4,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:28,titleWeight:"normal",titleAlign:"left",labelSize:18,labelWeight:"normal"},F=new Set;function C(r,e){if(!r)return e;let n=r.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:e:e}function J(r){if(!r)return{};let{headingFont:e,...n}=r;return e?{titleFont:e,labelFont:e,...n}:n}function te(r,e){return{...A,...J(r),...J(e)}}function Ee(r){let e=/^#?([0-9a-f]{6})$/i.exec(r.trim());if(!e)return null;let n=parseInt(e[1],16);return[n>>16&255,n>>8&255,n&255]}function ve(r,e,n){let[t,o,a]=[r,e,n].map(c=>{let i=c/255;return i<=.03928?i/12.92:Math.pow((i+.055)/1.055,2.4)});return .2126*t+.7152*o+.0722*a}function Q(r){let e=Ee(r);return e?ve(...e):null}function Ae(r,e){let n=Q(r);if(n===null||n<=.179)return"#ffffff";let t=Q(e);return t!==null&&(n+.05)/(t+.05)>=4.5?e:A.text}function ne(r,e){var d,u,l,x,h,f;let n=ee(e.bodyFont,e.fontFamily);r.style.setProperty("--canopy-font",n);for(let[s,p]of[["--canopy-title-font",e.titleFont],["--canopy-label-font",e.labelFont]]){let y=ee(p);r.style.setProperty(s,y==="inherit"?"var(--canopy-font)":y)}r.style.setProperty("--canopy-font-size",`${(d=e.fontSize)!=null?d:A.fontSize}px`);let t=C(e.text,A.text);r.style.setProperty("--canopy-text",t),r.style.setProperty("--canopy-bg",C(e.background,A.background)),r.style.setProperty("--canopy-field-bg",C(e.fieldBackground,A.fieldBackground));let o=C(e.primary,A.primary);r.style.setProperty("--canopy-primary",o),r.style.setProperty("--canopy-button-text",C(e.buttonTextColor,"")||Ae(o,t)),r.style.setProperty("--canopy-border",C(e.border,A.border)),r.style.setProperty("--canopy-radius",`${(u=e.radius)!=null?u:A.radius}px`),r.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),r.style.setProperty("--canopy-button-align",e.buttonAlign||A.buttonAlign);let a={sm:"1.25em",md:"1.5em",lg:"1.875em",xl:"2.25em"},c=(s,p)=>{var g;let y=Number(s);return y>0?`${y}px`:(g=a[String(s)])!=null?g:`${Number(p)}px`};r.style.setProperty("--canopy-title-size",c(e.titleSize,A.titleSize)),r.style.setProperty("--canopy-label-size",c(e.labelSize,A.labelSize));let i={light:"300",normal:"400",medium:"500",bold:"700",semibold:"700"};r.style.setProperty("--canopy-title-weight",(x=i[(l=e.titleWeight)!=null?l:"normal"])!=null?x:"400"),r.style.setProperty("--canopy-label-weight",(f=i[(h=e.labelWeight)!=null?h:"normal"])!=null?f:"400");for(let[s,p]of[["--canopy-title-color",e.titleColor],["--canopy-label-color",e.labelColor]]){let y=p?C(p,""):"";y?r.style.setProperty(s,y):r.style.removeProperty(s)}r.style.setProperty("--canopy-title-align",e.titleAlign==="center"?"center":"left")}function re(r){switch(r.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function ee(r,e){return r&&r!=="inherit"?`'${r}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function ae(r,e){let n=r.filter(c=>!!c&&c!=="inherit"&&!F.has(c));if(n.length===0)return;let t=n.map(c=>`family=${encodeURIComponent(c)}`).join("&"),o=`${e}/api/fonts?${t}`,a=document.createElement("link");a.rel="stylesheet",a.href=o,a.dataset.canopyFont="true",document.head.appendChild(a),n.forEach(c=>F.add(c))}function oe(r){if(!r||F.has(r))return;let e=document.createElement("link");e.rel="stylesheet",e.href=r,e.dataset.canopyFont="true",document.head.appendChild(e),F.add(r)}var j="Name",Ce={first:"First",middle:"Middle",middleInitial:"M.I.",last:"Last",single:j},S=["first","last"],ie=["first","middle","middleInitial","last","single"];function se(r){return[...r].sort((e,n)=>ie.indexOf(e)-ie.indexOf(n))}function D(r,e){var t;if(r!=null&&r.requiredParts)return r.requiredParts;let n=(t=r==null?void 0:r.parts)!=null?t:S;return e?n.filter(o=>o!=="middle"&&o!=="middleInitial"):[]}function H(r){return r==="middleInitial"?2:100}function R(r,e){return(e==null?void 0:e[r])||Ce[r]||r}var Te={line1:"Street",line2:"Apt, suite",city:"City",region:"State",postalCode:"ZIP"},le=["line1","line2","city","region","postalCode"];function L(r){var n;let e=(n=r==null?void 0:r.parts)!=null?n:le;return le.filter(t=>e.includes(t))}function T(r,e){return(e==null?void 0:e[r])||Te[r]||r}function X(r,e){return r!=null&&r.requiredParts?r.requiredParts:e?L(r).filter(n=>n!=="line2"):[]}var q=200,we=/^\d{5}(-\d{4})?$/;function ce(r,e,n){let t=L(e),o=X(e,n),a=i=>{var d;return String((d=r==null?void 0:r[i])!=null?d:"")},c=i=>a(i).trim();for(let i of t){if(o.includes(i)&&!c(i))return`${T(i,e==null?void 0:e.partLabels)} is required.`;if(a(i).length>q)return`${T(i,e==null?void 0:e.partLabels)} must be ${q} characters or fewer.`}return t.includes("postalCode")&&c("postalCode")&&!we.test(c("postalCode"))?`${T("postalCode",e==null?void 0:e.partLabels)} must be a US ZIP code, like 12345 or 12345-6789.`:null}var G="Choose one...",z="Other",k="__other__";function _(r){let e=Array.isArray(r)?r:r==null?void 0:r.options;return Array.isArray(e)?e.filter(n=>typeof n=="object"&&n!==null&&typeof n.value=="string"):[]}function B(r){return!Array.isArray(r)&&(r==null?void 0:r.allowOther)===!0}function K(r,e,n,t){let o=r==="CHECKBOXES"?e:typeof e=="string"?[e]:null;if(!Array.isArray(o)||o.some(i=>typeof i!="string"))return`${t} must be one of its options.`;if(new Set(o).size<o.length)return`${t} picks an option more than once.`;let a=_(n).map(i=>i.value),c=o.filter(i=>!a.includes(i));return c.length===0?null:!B(n)||c.length>1?`${t} must be one of its options.`:c[0].length>200?`${t} must be 200 characters or fewer.`:null}var W={TEXT:200,EMAIL:254,TEXTAREA:1e4,PHONE:30,NUMBER:50,DATE:30,DATE_OF_BIRTH:10,WEBSITE:2e3};function ue(r){return typeof r.validation=="object"&&r.validation!==null?r.validation:{}}function V(r){if(r.type!=="TEXTAREA")return;let e=ue(r).maxLength;return Number.isInteger(e)&&e>=1&&e<=W.TEXTAREA?e:void 0}var U=r=>`${r.toLocaleString("en-US")} character${r===1?"":"s"}`,Le=/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;function ke(r){return r.length>320||/[\r\n]/.test(r)?!1:Le.test(r)}function Ne(r){let e=r.replace(/[^\d+]/g,"");if(e.startsWith("+1"))e=e.substring(2);else{if(e.startsWith("+"))return null;e.startsWith("1")&&e.length===11&&(e=e.substring(1))}return/^\d{10}$/.test(e)?e:null}function O(r=new Date){let e=(n,t=2)=>String(n).padStart(t,"0");return`${e(r.getFullYear(),4)}-${e(r.getMonth()+1)}-${e(r.getDate())}`}function me(){let r=O();return{earliest:r,latest:r}}function ye(r){if(/^\d{4}-\d{2}-\d{2}$/.test(r)){let n=new Date(`${r}T00:00:00Z`);return!isNaN(n.getTime())&&n.toISOString().slice(0,10)===r?r:null}let e=new Date(r);return isNaN(e.getTime())?null:O(e)}function $e(r){let e=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(r);return e?ye(`${e[1]}-${e[2].padStart(2,"0")}-${e[3].padStart(2,"0")}`):null}function Se(r){let e=String(r).replace(/[,\s]/g,"");return/^-?(\d+\.?\d*|\.\d+)$/.test(e)?e:null}function Oe(r){let e=r.trim();if(/\s/.test(e))return null;let n=/^https?:\/\//i.test(e)?e:`https://${e}`;try{let t=new URL(n),o=t.hostname.split(".");return o.length>1&&o.every(Boolean)&&!t.username&&!t.password?n:null}catch(t){return null}}function pe(r,e,n){return e!==void 0&&r.length>e?`${n} must be ${U(e)} or fewer.`:null}function de(r,e,n,t){if(r==null)return null;if(typeof r!="object"||Array.isArray(r))return`${t} must be an object of its parts.`;for(let[o,a]of Object.entries(r)){if(!e.includes(o))return`${t} has no part "${o}".`;if(typeof a!="string")return`${n(o)} must be text.`}return null}function Me(r,e,n=me()){var i,d,u;let t=r.label||r.name,o=ue(r);switch(r.type){case"CHECKBOX":return e!=null&&typeof e!="boolean"&&e!=="on"?`${t} must be true or false.`:r.required&&!e?`${t} is required.`:null;case"CHECKBOXES":if(!Array.isArray(e)||e.length===0){if(r.required)return`${t} is required.`;if(e==null||Array.isArray(e))return null}return K("CHECKBOXES",e,r.options,t);case"NAME":{let l=typeof r.options=="object"&&r.options!==null?r.options:{},x=l.parts||S,h=y=>y==="single"?t:R(y,l.partLabels),f=de(e,x,h,t);if(f)return f;let s=e,p=D(l,r.required);for(let y of x){let g=s==null?void 0:s[y],m=h(y);if(p.includes(y)&&(!g||String(g).trim()===""))return`${m} is required.`;let E=pe(String(g!=null?g:""),H(y),m);if(E)return E}return null}case"ADDRESS":{let l=r.options,x=h=>T(h,l==null?void 0:l.partLabels);return(i=de(e,L(l),x,t))!=null?i:ce(e,l,r.required)}}if(e==null)return r.required?`${t} is required.`:null;if(typeof e!="string"&&!(r.type==="NUMBER"&&typeof e=="number"))return r.type==="NUMBER"?`${t} must be a number.`:`${t} must be text.`;let a=String(e);if(a.trim()==="")return r.required?`${t} is required.`:null;let c=pe(a,(d=V(r))!=null?d:W[r.type],t);if(c)return c;switch(r.type){case"DROPDOWN":return K("DROPDOWN",e,r.options,t);case"PHONE":{let l=o.format||"lenient";return l==="lenient"&&!/^[\d\s\-\(\)\+\.]{7,}$/.test(a)?`${t} must be a valid phone number.`:l==="strict"&&!Ne(a)?`${t} must be a valid US phone number (10 digits).`:null}case"DATE":{let l=ye(a);return l?o.minDate==="today"&&l<n.earliest?`${t} must be today or in the future.`:o.maxDate==="today"&&l>n.latest?`${t} must be today or in the past.`:null:`${t} must be a real date.`}case"DATE_OF_BIRTH":{let[l="",x="",h=""]=a.split("-");if(!x.trim())return`${t} must include a month.`;if(!h.trim())return`${t} must include a day.`;if(!l.trim())return`${t} must include a year.`;if(!/^\d{4}$/.test(l))return"Year must include 4 numbers.";let f=$e(a);return f?f>=n.latest?`${t} must be in the past.`:null:`${t} must be a real date.`}case"NUMBER":{let{min:l,max:x,integer:h}=o,f=Math.min(Math.max(10,l!=null?l:-1/0),x!=null?x:1/0),s=Se(e);if(s===null)return`${t} must be a ${h?"whole ":""}number, like ${f}.`;let p=Number(s);return h&&!Number.isInteger(p)?`${t} must be a whole number, like ${f}.`:l!==void 0&&p<l||x!==void 0&&p>x?l!==void 0&&x!==void 0?`${t} must be between ${l} and ${x}.`:l!==void 0?`${t} must be ${l} or more.`:`${t} must be ${x} or ${h?"fewer":"less"}.`:null}case"WEBSITE":return Oe(a)?null:`${t} must be a web address, like example.com.`;case"EMAIL":{let l=a.trim();if(!ke(l))return"Enter a valid email address";let x=l.split("@")[1].toLowerCase(),{allow:h,block:f}=(u=o.domainRules)!=null?u:{};return Array.isArray(h)&&h.length>0&&!h.some(s=>String(s).toLowerCase()===x)?`${t} must be from an allowed domain.`:Array.isArray(f)&&f.some(s=>String(s).toLowerCase()===x)?`${t} domain is not allowed.`:null}default:return null}}function fe(r,e,n=me()){let t={};for(let o of r){let a=Me(o,Ie(e,o.name),n);a&&(t[o.name]=a)}return t}function Ie(r,e){return Object.prototype.hasOwnProperty.call(r,e)?r[e]:void 0}var he=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var Fe={single:"name",first:"given-name",middle:"additional-name",last:"family-name"},De={line1:"address-line1",line2:"address-line2",city:"address-level2",region:"address-level1",postalCode:"postal-code"},He=[["month","Month",2,"bday-month"],["day","Day",2,"bday-day"],["year","Year",4,"bday-year"]],Re=r=>{let[e,n,t]=r.map(a=>a.value.trim());if(!e&&!n&&!t)return"";let o=a=>/^\d$/.test(a)?`0${a}`:a;return`${t}-${o(e)}-${o(n)}`},N=(r,e,n,t)=>r.setAttribute("aria-describedby",[e,t,n].flatMap(o=>o?[o.id]:[]).join(" ")),qe="feedback@canopyds.com",ze=0,M=class extends Error{constructor(e){super(e),this.name="InactiveFormError"}},I=class extends Error{constructor(e){super(e),this.name="HostedOnlyFormError"}},P=class{constructor(e,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.formEl=null;this.submitButton=null;this.instanceId=`canopy-${ze++}`;this.container=e,this.options=n}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){if(console.error(e),e instanceof M){this.renderInactive();return}if(e instanceof I){this.renderHostedOnly();return}this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var o;let e=this.options.baseUrl||"",n=this.options.formId||((o=this.formDefinition)==null?void 0:o.formId);if(!n)throw new Error("Form configuration error: no formId");let t=await fetch(`${e}/api/embed/${n}`,{method:"GET",credentials:"omit"});if(!t.ok){if(t.status===403)try{let a=await t.json();if((a==null?void 0:a.code)==="FORM_INACTIVE")throw new M(a.error||"Form is inactive");if((a==null?void 0:a.code)==="FORM_HOSTED_ONLY")throw new I(a.error||"Form is only available at its hosted URL")}catch(a){if(a instanceof M||a instanceof I)throw a}throw new Error("Failed to load form definition")}return t.json()}renderFromDefinition(e){this.container.classList.add("canopy-root"),this.formDefinition=e,this.render(e)}render(e){this.container.innerHTML="",this.fieldElements.clear();let n=te(e.defaultTheme,this.options.themeOverrides);ne(this.container,n),ae([n.bodyFont,n.titleFont,n.labelFont],this.options.baseUrl||""),!n.bodyFont&&!n.titleFont&&!n.labelFont&&oe(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(re(n));let t=e.fields&&e.fields.length>0,o=e.title||e.description;if(!t&&!o){this.renderSkeleton();return}if(e.title||e.description){let s=document.createElement("div");if(s.className="canopy-header",e.title){let p=document.createElement("h2");p.className="canopy-title",p.textContent=e.title,s.appendChild(p)}if(e.description){let p=document.createElement("p");p.className="canopy-description",p.textContent=e.description,s.appendChild(p)}this.container.appendChild(s)}let a=document.createElement("div");a.className="canopy-status",a.setAttribute("role","alert"),a.setAttribute("aria-live","assertive"),this.statusEl=a;let c=document.createElement("form");c.className="canopy-form",c.addEventListener("submit",s=>this.handleSubmit(s)),this.formEl=c,e.fields.forEach(s=>{let{wrapper:p,input:y,errorEl:g}=this.createField(s);p&&(p.dataset.fieldName=s.name,c.appendChild(p)),this.fieldElements.set(s.name,{input:y,errorEl:g})}),this.options.preview&&(c.setAttribute("autocomplete","off"),c.querySelectorAll("input, select, textarea").forEach(s=>s.setAttribute("autocomplete","off")));let i=document.createElement("button");i.type="submit",i.className="canopy-submit",i.textContent=n.buttonText||"Submit",this.options.preview&&(i.classList.add("canopy-submit-preview"),i.setAttribute("data-preview-tooltip","For preview only. No submission will be created"));let d=getComputedStyle(this.container),u=d.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",l=d.getPropertyValue("--canopy-button-text").trim()||"#ffffff",x=d.getPropertyValue("--canopy-radius").trim()||"8px",h=d.getPropertyValue("--canopy-button-width").trim()||"100%";i.style.cssText=`
      display: block !important;
      width: ${h} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${x} !important;
      padding: 10px 16px !important;
      font-family: var(--canopy-font, inherit) !important;
      font-size: var(--canopy-font-size, 16px) !important;
      font-weight: 600 !important;
      background: ${u} !important;
      background-color: ${u} !important;
      color: ${l} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=i;let f=document.createElement("div");f.className="canopy-form-actions",f.appendChild(i),c.appendChild(f),this.container.appendChild(a),this.container.appendChild(c),this.container.appendChild(this.renderWatermark(e))}renderWatermark(e){let n=document.createElement("div");n.className="canopy-watermark";let t=document.createElement("span");t.className="canopy-watermark-brand",t.textContent="Powered by Canopy Forms (Beta)",n.appendChild(t);let o=document.createElement("span");o.className="canopy-watermark-sep",o.setAttribute("aria-hidden","true"),o.textContent="\xB7",n.appendChild(o);let a=(e==null?void 0:e.title)||(e==null?void 0:e.name)||(e==null?void 0:e.formId)||"unknown form",c=(e==null?void 0:e.formId)||"unknown",i=`Canopy Forms issue \u2014 ${a}`,d=[`Form: ${a}`,`Form ID: ${c}`,"","Describe the issue:",""].join(`
`),u=`mailto:${qe}?subject=${encodeURIComponent(i)}&body=${encodeURIComponent(d)}`,l=document.createElement("a");return l.className="canopy-watermark-link",l.href=u,l.textContent="Report an issue",l.rel="noopener",n.appendChild(l),n}createField(e){var x,h,f;let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field";let o=document.createElement("label");if(o.className="canopy-label",o.dataset.fieldPart="label",o.htmlFor=n,o.textContent=e.label||e.name,e.required){let s=document.createElement("span");s.className="canopy-required",s.textContent=" *",s.setAttribute("aria-hidden","true"),o.appendChild(s)}let a;switch(e.type){case"TEXTAREA":{let s=document.createElement("textarea");s.className="canopy-textarea";let p=V(e);s.rows=p?Math.min(Math.max(Math.ceil(p/60),4),15):5,a=s;break}case"DROPDOWN":{let s=_(e.options),p=Array.isArray(e.options)||(x=e.options)==null?void 0:x.defaultValue,y=s.some(b=>b.value===p),g=B(e.options),m=document.createElement("select");m.className="canopy-select";let E=document.createElement("option");if(E.value="",E.textContent=G,E.disabled=!0,E.selected=!y,m.appendChild(E),s.forEach(b=>{let v=document.createElement("option");v.value=b.value,v.textContent=b.label,y&&b.value===p&&(v.selected=!0),m.appendChild(v)}),g){let b=document.createElement("option");b.value=k,b.textContent=z,m.appendChild(b)}if(a=m,g){let b=this.createOtherInput(e);m.addEventListener("change",()=>{m.value===k?(b.style.setProperty("display","block","important"),e.required&&(b.required=!0)):(b.style.setProperty("display","none","important"),b.required=!1,b.value="")}),m.__otherInput=b}break}case"CHECKBOX":{let s=document.createElement("label");s.className="canopy-checkbox";let p=document.createElement("input");p.type="checkbox",p.id=n,p.name=e.name,e.required&&p.setAttribute("aria-required","true"),p.addEventListener("change",()=>{p.setCustomValidity("")}),s.appendChild(p);let y=document.createElement("span");y.dataset.fieldPart="label",y.textContent=e.label||e.name,s.appendChild(y),t.appendChild(s);let g=this.createHelpText(e,n);g&&t.appendChild(g);let m=document.createElement("span");return m.className="canopy-error",m.id=`${n}-error`,t.appendChild(m),N(p,g,m),p.setAttribute("aria-invalid","false"),{wrapper:t,input:p,errorEl:m}}case"CHECKBOXES":{let s=document.createElement("div");s.className="canopy-checkboxes",s.setAttribute("data-checkbox-group",e.name);let p=()=>{let b=s.querySelector("input[type=checkbox]");b&&b.setCustomValidity("")},y=(b,v,xe)=>{let $=document.createElement("label");$.className="canopy-checkbox",$.dataset.fieldPart=xe;let w=document.createElement("input");w.type="checkbox",w.name=e.name,w.value=b,w.addEventListener("change",p);let Y=document.createElement("span");return Y.textContent=v,$.appendChild(w),$.appendChild(Y),s.appendChild($),w};if(_(e.options).forEach((b,v)=>{y(b.value,b.label,`option-${v}`)}),B(e.options)){let b=y(k,z,"option-other"),v=this.createOtherInput(e);v.dataset.choiceOther=e.name,v.addEventListener("input",p),b.addEventListener("change",()=>{b.checked?(v.style.setProperty("display","block","important"),v.focus()):(v.style.setProperty("display","none","important"),v.value="")}),s.appendChild(v)}let g=document.createElement("input");g.type="hidden",g.id=n,g.name=e.name,o.id=`${n}-label`,s.setAttribute("role","group"),s.setAttribute("aria-labelledby",o.id);let m=this.createHelpText(e,n);t.appendChild(o),m&&t.appendChild(m),t.appendChild(s);let E=document.createElement("span");return E.className="canopy-error",E.id=`${n}-error`,t.appendChild(E),N(s,m,E),g.setAttribute("aria-invalid","false"),{wrapper:t,input:g,errorEl:E}}case"EMAIL":{let s=document.createElement("input");s.type="email",s.setAttribute("autocomplete","email"),s.className="canopy-input",a=s;break}case"PHONE":{let s=document.createElement("input");s.type="tel",s.setAttribute("inputmode","tel"),s.setAttribute("autocomplete","tel"),s.className="canopy-input",a=s;break}case"WEBSITE":{let s=document.createElement("input");s.type="text",s.className="canopy-input",s.setAttribute("inputmode","url"),s.setAttribute("autocomplete","url"),s.setAttribute("autocapitalize","none"),s.setAttribute("autocorrect","off"),s.spellcheck=!1,a=s;break}case"DATE":{let s=document.createElement("input");s.type="date",s.className="canopy-input",((h=e.validation)==null?void 0:h.minDate)==="today"&&(s.min=O()),((f=e.validation)==null?void 0:f.maxDate)==="today"&&(s.max=O()),a=s;break}case"NUMBER":{let s=document.createElement("input");s.type="text",s.className="canopy-input",s.spellcheck=!1;let p=e.validation;(p==null?void 0:p.min)!==void 0&&p.min<0||s.setAttribute("inputmode",p!=null&&p.integer?"numeric":"decimal"),a=s;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);case"DATE_OF_BIRTH":return this.createDateOfBirthField(e);default:{let s=document.createElement("input");s.type="text",s.className="canopy-input",a=s}}a.id=n,a.name=e.name,a.dataset.fieldPart="input",a.setAttribute("aria-invalid","false"),e.required&&a.setAttribute("aria-required","true");let c=W[e.type];c&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=c),a.addEventListener("input",()=>{a.setCustomValidity("")});let i=document.createElement("span");i.className="canopy-error",i.id=`${n}-error`;let d=this.createHelpText(e,n);t.appendChild(o),d&&t.appendChild(d),t.appendChild(a);let u=V(e),l=u&&a instanceof HTMLTextAreaElement?this.addCharacterCount(t,a,u,n):void 0;return N(a,d,i,l),a.__otherInput&&t.appendChild(a.__otherInput),t.appendChild(i),{wrapper:t,input:a,errorEl:i}}createHelpText(e,n){if(!e.helpText)return null;let t=document.createElement("p");return t.className="canopy-help-text",t.id=`${n}-help`,t.textContent=e.helpText,t}addCharacterCount(e,n,t,o){let a=document.createElement("p");a.className="canopy-visually-hidden",a.id=`${o}-limit`,a.textContent=`You can enter up to ${U(t)}`;let c=document.createElement("p");c.className="canopy-count",c.setAttribute("aria-hidden","true");let i=document.createElement("p");i.className="canopy-visually-hidden",i.setAttribute("aria-live","polite");let d=()=>{let l=t-n.value.length;c.textContent=`You have ${U(Math.abs(l))} ${l<0?"too many":"remaining"}`,c.toggleAttribute("data-over",l<0)},u;return n.addEventListener("input",()=>{d(),clearTimeout(u),u=setTimeout(()=>i.textContent=c.textContent,1e3)}),d(),e.append(a,c,i),a}createOtherInput(e){let n=document.createElement("input");return n.type="text",n.className="canopy-input canopy-choice-other",n.name=`${e.name}_other`,n.placeholder="Please specify...",n.maxLength=200,n.setAttribute("aria-label",`${e.label||e.name}: ${z}`),n.style.setProperty("display","none","important"),n.addEventListener("input",()=>{n.setCustomValidity("")}),n}createNameField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-name-group",t.setAttribute("role","group");let o=e.options||{},a=se(o.parts||S),c=D(o,e.required),i=e.label||j,d=a.includes("single"),u=this.createHelpText(e,n);if(d)t.setAttribute("aria-label",i);else{let f=document.createElement("span");f.id=`${n}-group-label`,f.className="canopy-label",f.dataset.fieldPart="label",f.textContent=i,t.appendChild(f),u&&t.appendChild(u),t.setAttribute("aria-labelledby",f.id)}let l=document.createElement("div");l.className="canopy-name-parts";let x=document.createElement("input");x.type="hidden",x.id=n,x.name=e.name;let h=document.createElement("span");return h.className="canopy-error",h.id=`${n}-error`,a.forEach(f=>{let s=document.createElement("div");s.className=f==="middleInitial"?"canopy-name-part canopy-name-part-initial":"canopy-name-part";let p=document.createElement("label");p.className=d?"canopy-label":"canopy-name-part-label";let y=`${n}-${f}`;p.htmlFor=y,p.textContent=d?i:R(f,o.partLabels),p.dataset.fieldPart=d?"label":`label-${f}`;let g=c.includes(f);if(g){let b=document.createElement("span");b.className="canopy-required",b.textContent=" *",b.setAttribute("aria-hidden","true"),p.appendChild(b)}let m=document.createElement("input");m.type="text",m.className="canopy-input",m.id=y,m.name=`${e.name}.${f}`,m.setAttribute("data-name-part",f),m.setAttribute("data-name-field",e.name),m.maxLength=H(f);let E=Fe[f];E&&m.setAttribute("autocomplete",E),g&&m.setAttribute("aria-required","true"),m.addEventListener("input",()=>{l.querySelectorAll("input[data-name-part]").forEach(b=>b.setCustomValidity(""))}),s.appendChild(p),d&&u&&s.appendChild(u),s.appendChild(m),l.appendChild(s)}),t.appendChild(l),N(t,u,h),t.appendChild(h),{wrapper:t,input:x,errorEl:h}}createAddressField(e){let n=`${this.instanceId}-${e.name}`,t=e.options||{},o=document.createElement("div");o.className="canopy-field canopy-address-group",o.setAttribute("role","group"),o.setAttribute("aria-labelledby",`${n}-group-label`);let a=document.createElement("span");a.id=`${n}-group-label`,a.className="canopy-label",a.dataset.fieldPart="label",a.textContent=e.label||"Address",o.appendChild(a);let c=this.createHelpText(e,n);c&&o.appendChild(c);let i=document.createElement("div");i.className="canopy-address-parts";let d=document.createElement("input");d.type="hidden",d.id=n,d.name=e.name;let u=document.createElement("span");u.className="canopy-error",u.id=`${n}-error`;let l={postalCode:{maxlength:"10",inputmode:"numeric"}},x=X(t,e.required);return L(t).forEach(h=>{let f=x.includes(h),s=document.createElement("div");s.className=`canopy-address-part canopy-address-part-${h}`;let p=document.createElement("label");p.className="canopy-address-part-label";let y=`${n}-${h}`;if(p.htmlFor=y,p.textContent=T(h,t.partLabels),p.dataset.fieldPart=`label-${h}`,f){let m=document.createElement("span");m.className="canopy-required",m.textContent=" *",m.setAttribute("aria-hidden","true"),p.appendChild(m)}let g;if(h==="region"){let m=document.createElement("select");m.className="canopy-select";let E=document.createElement("option");E.value="",E.textContent=G,m.appendChild(E),he.forEach(b=>{let v=document.createElement("option");v.value=b.value,v.textContent=b.label,m.appendChild(v)}),m.addEventListener("change",()=>{i.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(b=>b.setCustomValidity(""))}),g=m}else{let m=document.createElement("input");m.type="text",m.className="canopy-input",m.maxLength=q,l[h]&&Object.entries(l[h]).forEach(([E,b])=>m.setAttribute(E,b)),m.addEventListener("input",()=>{i.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(E=>E.setCustomValidity(""))}),g=m}g.id=y,g.setAttribute("autocomplete",De[h]),g.setAttribute("data-address-part",h),g.setAttribute("data-address-field",e.name),f&&g.setAttribute("aria-required","true"),s.appendChild(p),s.appendChild(g),i.appendChild(s)}),o.appendChild(i),N(o,c,u),o.appendChild(u),{wrapper:o,input:d,errorEl:u}}createDateOfBirthField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-dob-group",t.setAttribute("role","group");let o=document.createElement("span");if(o.id=`${n}-group-label`,o.className="canopy-label",o.dataset.fieldPart="label",o.textContent=e.label||e.name,e.required){let u=document.createElement("span");u.className="canopy-required",u.textContent=" *",u.setAttribute("aria-hidden","true"),o.appendChild(u)}t.appendChild(o),t.setAttribute("aria-labelledby",o.id);let a=this.createHelpText(e,n);a&&t.appendChild(a);let c=document.createElement("div");c.className="canopy-dob-parts";let i=document.createElement("input");i.type="hidden",i.id=n,i.name=e.name;let d=document.createElement("span");return d.className="canopy-error",d.id=`${n}-error`,He.forEach(([u,l,x,h])=>{let f=document.createElement("div");f.className=`canopy-dob-part canopy-dob-part-${u}`;let s=`${n}-${u}`,p=document.createElement("label");p.className="canopy-dob-part-label",p.htmlFor=s,p.textContent=l;let y=document.createElement("input");y.type="text",y.className="canopy-input",y.id=s,y.name=`${e.name}.${u}`,y.maxLength=x,y.setAttribute("inputmode","numeric"),y.setAttribute("autocomplete",h),y.setAttribute("data-dob-part",u),y.setAttribute("data-dob-field",e.name),e.required&&y.setAttribute("aria-required","true"),y.addEventListener("input",()=>this.partsOf(e.name).forEach(g=>g.setCustomValidity(""))),f.appendChild(p),f.appendChild(y),c.appendChild(f)}),t.appendChild(c),N(t,a,d),t.appendChild(d),{wrapper:t,input:i,errorEl:d}}partsOf(e){return this.container.querySelectorAll(`input[data-name-field="${e}"], input[data-address-field="${e}"], select[data-address-field="${e}"], input[data-dob-field="${e}"]`)}collectValues(){let e={};return this.fieldElements.forEach((n,t)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")e[t]=n.input.checked;else if(n.input.type==="hidden"){let o=this.container.querySelector(`[data-checkbox-group="${t}"]`),a=this.container.querySelectorAll(`input[data-dob-field="${t}"]`);if(a.length>0)e[t]=Re([...a]);else if(o){let c=[];o.querySelectorAll("input[type=checkbox]:checked").forEach(i=>{var u;if(i.value!==k){c.push(i.value);return}let d=(u=o.querySelector("[data-choice-other]"))==null?void 0:u.value.trim();d&&c.push(d)}),e[t]=c}else{let c=this.container.querySelectorAll(`input[data-name-field="${t}"]`);if(c.length>0){let i={};c.forEach(d=>{let u=d,l=u.getAttribute("data-name-part");l&&(i[l]=u.value)}),e[t]=i}else{let i=this.container.querySelectorAll(`input[data-address-field="${t}"], select[data-address-field="${t}"]`);if(i.length>0){let d={};i.forEach(u=>{let l=u.getAttribute("data-address-part");l&&(d[l]=u.value)}),e[t]=d}else e[t]=n.input.value}}}else e[t]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value===k&&n.input.__otherInput?e[t]=n.input.__otherInput.value:e[t]=n.input.value}),e}findFailingInput(e){var c;let n=[...this.container.querySelectorAll(`input[data-dob-field="${e}"]`)];if(n.length>0){let[i,,d]=n;return(c=n.find(u=>!u.value.trim()))!=null?c:/^\d{4}$/.test(d.value.trim())?i:d}let t=this.container.querySelectorAll(`input[data-name-field="${e}"]`),o=i=>i.getAttribute("aria-required")==="true"&&!i.value.trim()||i instanceof HTMLInputElement&&i.maxLength>0&&i.value.length>i.maxLength;if(t.length>0){for(let i of t)if(o(i))return i;return t[0]}let a=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(a.length>0){for(let i of a)if(o(i))return i;for(let i of a)if(i.getAttribute("data-address-part")==="postalCode")return i;return a[0]}return null}showErrors(e){this.fieldElements.forEach((t,o)=>{let a=e[o]||"";if(t.input.type==="hidden"){let c=this.container.querySelector(`[data-checkbox-group="${o}"]`);if(c){let i=c.querySelector("input[type=checkbox]");i&&i.setCustomValidity(a)}else{let i=a?this.findFailingInput(o):null;i?i.setCustomValidity(a):this.partsOf(o).forEach(d=>d.setCustomValidity(""))}}else t.input.setCustomValidity(a);t.errorEl.textContent=a,t.input.setAttribute("aria-invalid",a?"true":"false")});let n=Object.keys(e);if(n.length>0){let t=this.fieldElements.get(n[0]);if(t)if(t.input.type==="hidden"){let o=this.container.querySelector(`[data-checkbox-group="${n[0]}"]`);if(o){let a=o.querySelector("input[type=checkbox]");a&&(a.reportValidity(),a.focus())}else{let a=this.findFailingInput(n[0]);a&&(a.reportValidity(),a.focus())}}else t.input.reportValidity(),t.input.focus()}}setStatus(e,n){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(e){var o,a,c;if(e.preventDefault(),!this.formDefinition||this.options.preview)return;this.setStatus("","info"),this.fieldElements.forEach((i,d)=>{if(i.input.setCustomValidity(""),i.input.type==="hidden"){let u=this.container.querySelector(`[data-checkbox-group="${d}"]`);if(u){let l=u.querySelector("input[type=checkbox]");l&&l.setCustomValidity("")}else this.partsOf(d).forEach(l=>l.setCustomValidity(""))}});let n=this.collectValues(),t=fe(this.formDefinition.fields,n);if(this.showErrors(t),Object.keys(t).length>0){let i=Object.keys(t).length;this.setStatus(`Please fix ${i} field${i>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let i=this.options.baseUrl||"",d=this.options.formId||((o=this.formDefinition)==null?void 0:o.formId);if(!d){this.setStatus("Form configuration error.","error");return}let u=await fetch(`${i}/api/embed/${d}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),l=await u.json();if(!u.ok){l!=null&&l.fields&&this.showErrors(l.fields),this.setStatus((l==null?void 0:l.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}e.target.reset(),this.renderSuccess(this.formDefinition.successMessage||"Thanks for your submission!")}catch(i){console.error(i),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let i=((c=(a=this.formDefinition)==null?void 0:a.defaultTheme)==null?void 0:c.buttonText)||"Submit";this.submitButton.textContent=i,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderSuccess(e){this.statusEl&&(this.statusEl.textContent="",this.statusEl.className="canopy-status"),this.formEl&&(this.formEl.style.display="none");let n=this.container.querySelector(".canopy-success");n&&n.remove();let t=document.createElement("div");t.className="canopy-success",t.setAttribute("role","status"),t.setAttribute("aria-live","polite");let o=document.createElement("div");o.className="canopy-success-icon",o.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',t.appendChild(o);let a=document.createElement("p");a.className="canopy-success-message",a.textContent=e,t.appendChild(a);let c=document.createElement("button");c.type="button",c.className="canopy-success-reset",c.textContent="Submit another response",c.addEventListener("click",()=>{this.formDefinition&&this.render(this.formDefinition)}),t.appendChild(c),this.container.appendChild(t)}renderSkeleton(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-skeleton";let n=[{labelW:"30%",type:"input"},{labelW:"45%",type:"input"},{labelW:"25%",type:"textarea"}],t=0,o=document.createElement("div");o.className="canopy-skeleton-bar canopy-skeleton-title",o.style.animationDelay=`${t}s`,e.appendChild(o),t+=.15;let a=document.createElement("div");a.className="canopy-skeleton-bar canopy-skeleton-desc",a.style.animationDelay=`${t}s`,e.appendChild(a),t+=.15;for(let i of n){let d=document.createElement("div");d.className="canopy-skeleton-field";let u=document.createElement("div");u.className="canopy-skeleton-bar canopy-skeleton-label",u.style.width=i.labelW,u.style.animationDelay=`${t}s`,d.appendChild(u),t+=.1;let l=document.createElement("div");l.className=`canopy-skeleton-bar canopy-skeleton-${i.type}`,l.style.animationDelay=`${t}s`,d.appendChild(l),t+=.15,e.appendChild(d)}let c=document.createElement("div");c.className="canopy-skeleton-bar canopy-skeleton-button",c.style.animationDelay=`${t}s`,e.appendChild(c),this.container.appendChild(e)}renderError(e){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=e,this.container.appendChild(n),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderInactive(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let n=document.createElement("h2");n.className="canopy-inactive-heading",n.textContent="Form Not Available",e.appendChild(n);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is not currently accepting responses. Please contact the form owner if you believe this is an error.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderHostedOnly(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let n=document.createElement("h2");n.className="canopy-inactive-heading",n.textContent="Form Not Available",e.appendChild(n);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is only available at its hosted URL and cannot be embedded. Please contact the form owner.",e.appendChild(t),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}};var be=`
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
`;var ge="canopy-embed-styles";function _e(){if(document.getElementById(ge))return;let r=document.createElement("style");r.id=ge,r.textContent=be,document.head.appendChild(r)}function Be(r){var e;return r.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function We(r){let e=r.dataset.theme;if(e)try{return JSON.parse(e)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function Z(){_e(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=e.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let t=We(e),o=Be(e);new P(e,{formId:n,themeOverrides:t,baseUrl:o}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Z):Z();window.CanopyForms={init:Z,CanopyForm:P};})();
