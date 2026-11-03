"use strict";(()=>{var v={fontSize:16,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:4,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:28,titleWeight:"normal",titleAlign:"left",labelSize:18,labelWeight:"normal"},F=new Set;function C(r,e){if(!r)return e;let t=r.trim();return t?/^var\(/i.test(t)||/^rgb/i.test(t)||/^hsl/i.test(t)||/^color\(/i.test(t)||/^(transparent|currentcolor|inherit)$/i.test(t)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(t)?t:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(t)?`#${t}`:e:e}function Y(r){if(!r)return{};let{headingFont:e,...t}=r;return e?{titleFont:e,labelFont:e,...t}:t}function ee(r,e){return{...v,...Y(r),...Y(e)}}function ge(r){let e=/^#?([0-9a-f]{6})$/i.exec(r.trim());if(!e)return null;let t=parseInt(e[1],16);return[t>>16&255,t>>8&255,t&255]}function xe(r,e,t){let[n,o,a]=[r,e,t].map(p=>{let i=p/255;return i<=.03928?i/12.92:Math.pow((i+.055)/1.055,2.4)});return .2126*n+.7152*o+.0722*a}function J(r){let e=ge(r);return e?xe(...e):null}function Ee(r,e){let t=J(r);if(t===null||t<=.179)return"#ffffff";let n=J(e);return n!==null&&(t+.05)/(n+.05)>=4.5?e:v.text}function te(r,e){var d,l,y,g,s,c;let t=Q(e.bodyFont,e.fontFamily);r.style.setProperty("--canopy-font",t);for(let[h,m]of[["--canopy-title-font",e.titleFont],["--canopy-label-font",e.labelFont]]){let f=Q(m);r.style.setProperty(h,f==="inherit"?"var(--canopy-font)":f)}r.style.setProperty("--canopy-font-size",`${(d=e.fontSize)!=null?d:v.fontSize}px`);let n=C(e.text,v.text);r.style.setProperty("--canopy-text",n),r.style.setProperty("--canopy-bg",C(e.background,v.background)),r.style.setProperty("--canopy-field-bg",C(e.fieldBackground,v.fieldBackground));let o=C(e.primary,v.primary);r.style.setProperty("--canopy-primary",o),r.style.setProperty("--canopy-button-text",C(e.buttonTextColor,"")||Ee(o,n)),r.style.setProperty("--canopy-border",C(e.border,v.border)),r.style.setProperty("--canopy-radius",`${(l=e.radius)!=null?l:v.radius}px`),r.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),r.style.setProperty("--canopy-button-align",e.buttonAlign||v.buttonAlign);let a={sm:"1.25em",md:"1.5em",lg:"1.875em",xl:"2.25em"},p=(h,m)=>{var b;let f=Number(h);return f>0?`${f}px`:(b=a[String(h)])!=null?b:`${Number(m)}px`};r.style.setProperty("--canopy-title-size",p(e.titleSize,v.titleSize)),r.style.setProperty("--canopy-label-size",p(e.labelSize,v.labelSize));let i={light:"300",normal:"400",medium:"500",bold:"700",semibold:"700"};r.style.setProperty("--canopy-title-weight",(g=i[(y=e.titleWeight)!=null?y:"normal"])!=null?g:"400"),r.style.setProperty("--canopy-label-weight",(c=i[(s=e.labelWeight)!=null?s:"normal"])!=null?c:"400");for(let[h,m]of[["--canopy-title-color",e.titleColor],["--canopy-label-color",e.labelColor]]){let f=m?C(m,""):"";f?r.style.setProperty(h,f):r.style.removeProperty(h)}r.style.setProperty("--canopy-title-align",e.titleAlign==="center"?"center":"left")}function ne(r){switch(r.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function Q(r,e){return r&&r!=="inherit"?`'${r}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function re(r,e){let t=r.filter(p=>!!p&&p!=="inherit"&&!F.has(p));if(t.length===0)return;let n=t.map(p=>`family=${encodeURIComponent(p)}`).join("&"),o=`${e}/api/fonts?${n}`,a=document.createElement("link");a.rel="stylesheet",a.href=o,a.dataset.canopyFont="true",document.head.appendChild(a),t.forEach(p=>F.add(p))}function ae(r){if(!r||F.has(r))return;let e=document.createElement("link");e.rel="stylesheet",e.href=r,e.dataset.canopyFont="true",document.head.appendChild(e),F.add(r)}var W="Name",ve={first:"First",middle:"Middle",middleInitial:"M.I.",last:"Last",single:W},k=["first","last"],oe=["first","middle","middleInitial","last","single"];function ie(r){return[...r].sort((e,t)=>oe.indexOf(e)-oe.indexOf(t))}function D(r,e){var n;if(r!=null&&r.requiredParts)return r.requiredParts;let t=(n=r==null?void 0:r.parts)!=null?n:k;return e?t.filter(o=>o!=="middle"&&o!=="middleInitial"):[]}function H(r){return r==="middleInitial"?2:100}function R(r,e){return(e==null?void 0:e[r])||ve[r]||r}var Ae={line1:"Street",line2:"Apt, suite",city:"City",region:"State",postalCode:"ZIP"},se=["line1","line2","city","region","postalCode"];function L(r){var t;let e=(t=r==null?void 0:r.parts)!=null?t:se;return se.filter(n=>e.includes(n))}function T(r,e){return(e==null?void 0:e[r])||Ae[r]||r}function U(r,e){return r!=null&&r.requiredParts?r.requiredParts:e?L(r).filter(t=>t!=="line2"):[]}var q=200,Ce=/^\d{5}(-\d{4})?$/;function le(r,e,t){let n=L(e),o=U(e,t),a=i=>{var d;return String((d=r==null?void 0:r[i])!=null?d:"")},p=i=>a(i).trim();for(let i of n){if(o.includes(i)&&!p(i))return`${T(i,e==null?void 0:e.partLabels)} is required.`;if(a(i).length>q)return`${T(i,e==null?void 0:e.partLabels)} must be at most ${q} characters.`}return n.includes("postalCode")&&p("postalCode")&&!Ce.test(p("postalCode"))?`${T("postalCode",e==null?void 0:e.partLabels)} must be a US ZIP code, like 12345 or 12345-6789.`:null}var V="Choose one...",_="Other",N="__other__";function z(r){let e=Array.isArray(r)?r:r==null?void 0:r.options;return Array.isArray(e)?e.filter(t=>typeof t=="object"&&t!==null&&typeof t.value=="string"):[]}function B(r){return!Array.isArray(r)&&(r==null?void 0:r.allowOther)===!0}function j(r,e,t,n){let o=r==="CHECKBOXES"?e:typeof e=="string"?[e]:null;if(!Array.isArray(o)||o.some(i=>typeof i!="string"))return`${n} must be one of its options.`;if(new Set(o).size<o.length)return`${n} picks an option more than once.`;let a=z(t).map(i=>i.value),p=o.filter(i=>!a.includes(i));return p.length===0?null:!B(t)||p.length>1?`${n} must be one of its options.`:p[0].length>200?`${n} must be 200 characters or fewer.`:null}var de={TEXT:200,EMAIL:254,TEXTAREA:2e3},Te={TEXT:500,EMAIL:320,TEXTAREA:1e4,PHONE:30,NUMBER:50,DATE:30,DATE_OF_BIRTH:10};function G(r){return typeof r.validation=="object"&&r.validation!==null?r.validation:{}}function S(r){let e=de[r.type],t=Te[r.type];if(e===void 0)return t;let n=G(r).maxLength,o=Number.isInteger(n)&&n>0?n:e;return t!==void 0?Math.min(o,t):o}var we=/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;function Le(r){return r.length>320||/[\r\n]/.test(r)?!1:we.test(r)}function Ne(r){let e=r.replace(/[^\d+]/g,"");if(e.startsWith("+1"))e=e.substring(2);else{if(e.startsWith("+"))return null;e.startsWith("1")&&e.length===11&&(e=e.substring(1))}return/^\d{10}$/.test(e)?e:null}function O(r=new Date){let e=(t,n=2)=>String(t).padStart(n,"0");return`${e(r.getFullYear(),4)}-${e(r.getMonth()+1)}-${e(r.getDate())}`}function ue(){let r=O();return{earliest:r,latest:r}}function me(r){if(/^\d{4}-\d{2}-\d{2}$/.test(r)){let t=new Date(`${r}T00:00:00Z`);return!isNaN(t.getTime())&&t.toISOString().slice(0,10)===r?r:null}let e=new Date(r);return isNaN(e.getTime())?null:O(e)}function $e(r){let e=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(r);return e?me(`${e[1]}-${e[2].padStart(2,"0")}-${e[3].padStart(2,"0")}`):null}function X(r,e,t){return e!==void 0&&r.length>e?`${t} must be at most ${e} characters.`:null}function ce(r,e,t){let{minLength:n}=G(r);return n&&e.length<n?`${t} must be at least ${n} characters.`:X(e,S(r),t)}function ke(r,e,t){switch(r){case"numbers":return/^\d+$/.test(e)?null:`${t} must contain only numbers.`;case"letters":return/^[A-Za-z]+$/.test(e)?null:`${t} must contain only letters.`;case"url":{try{if(new URL(e.startsWith("http")?e:`https://${e}`).hostname.includes("."))return null}catch(n){}return`${t} must be a valid URL.`}case"postal-us":return/^\d{5}(-\d{4})?$/.test(e)?null:`${t} must be a valid US postal code (e.g., 12345 or 12345-6789).`;case"postal-ca":return/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(e)?null:`${t} must be a valid Canadian postal code (e.g., K1A 0B1).`;default:return null}}function pe(r,e,t,n){if(r==null)return null;if(typeof r!="object"||Array.isArray(r))return`${n} must be an object of its parts.`;for(let[o,a]of Object.entries(r)){if(!e.includes(o))return`${n} has no part "${o}".`;if(typeof a!="string")return`${t(o)} must be text.`}return null}function Se(r,e,t=ue()){var p,i,d;let n=r.label||r.name,o=G(r);switch(r.type){case"CHECKBOX":return e!=null&&typeof e!="boolean"&&e!=="on"?`${n} must be true or false.`:r.required&&!e?`${n} is required.`:null;case"CHECKBOXES":if(!Array.isArray(e)||e.length===0){if(r.required)return`${n} is required.`;if(e==null||Array.isArray(e))return null}return j("CHECKBOXES",e,r.options,n);case"NAME":{let l=typeof r.options=="object"&&r.options!==null?r.options:{},y=l.parts||k,g=m=>m==="single"?n:R(m,l.partLabels),s=pe(e,y,g,n);if(s)return s;let c=e,h=D(l,r.required);for(let m of y){let f=c==null?void 0:c[m],b=g(m);if(h.includes(m)&&(!f||String(f).trim()===""))return`${b} is required.`;let u=X(String(f!=null?f:""),H(m),b);if(u)return u}return null}case"ADDRESS":{let l=r.options,y=g=>T(g,l==null?void 0:l.partLabels);return(p=pe(e,L(l),y,n))!=null?p:le(e,l,r.required)}}if(e==null)return r.required?`${n} is required.`:null;if(typeof e!="string"&&!(r.type==="NUMBER"&&typeof e=="number"))return r.type==="NUMBER"?`${n} must be a number.`:`${n} must be text.`;let a=String(e);if(a.trim()==="")return r.required?`${n} is required.`:null;if(de[r.type]===void 0){let l=X(a,S(r),n);if(l)return l}switch(r.type){case"DROPDOWN":return j("DROPDOWN",e,r.options,n);case"PHONE":{let l=o.format||"lenient";return l==="lenient"&&!/^[\d\s\-\(\)\+\.]{7,}$/.test(a)?`${n} must be a valid phone number.`:l==="strict"&&!Ne(a)?`${n} must be a valid US phone number (10 digits).`:null}case"DATE":{let l=me(a);return l?o.minDate==="today"&&l<t.earliest?`${n} must be today or in the future.`:o.maxDate==="today"&&l>t.latest?`${n} must be today or in the past.`:null:`${n} must be a real date.`}case"DATE_OF_BIRTH":{let[l="",y="",g=""]=a.split("-");if(!y.trim())return`${n} must include a month.`;if(!g.trim())return`${n} must include a day.`;if(!l.trim())return`${n} must include a year.`;if(!/^\d{4}$/.test(l))return"Year must include 4 numbers.";let s=$e(a);return s?s>=t.latest?`${n} must be in the past.`:null:`${n} must be a real date.`}case"NUMBER":{let l=Number(e);return isNaN(l)?`${n} must be a number.`:o.integer&&!Number.isInteger(l)?`${n} must be a whole number.`:o.min!==void 0&&l<o.min?`${n} must be at least ${o.min}.`:o.max!==void 0&&l>o.max?`${n} must be at most ${o.max}.`:null}case"EMAIL":{let l=a.trim();if(!Le(l))return"Enter a valid email address";let y=l.split("@")[1].toLowerCase(),{allow:g,block:s}=(i=o.domainRules)!=null?i:{};return Array.isArray(g)&&g.length>0&&!g.some(c=>String(c).toLowerCase()===y)?`${n} must be from an allowed domain.`:Array.isArray(s)&&s.some(c=>String(c).toLowerCase()===y)?`${n} domain is not allowed.`:ce(r,l,n)}default:return(d=ce(r,a,n))!=null?d:ke(o.format,a,n)}}function ye(r,e,t=ue()){let n={};for(let o of r){let a=Se(o,Oe(e,o.name),t);a&&(n[o.name]=a)}return n}function Oe(r,e){return Object.prototype.hasOwnProperty.call(r,e)?r[e]:void 0}var fe=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var Ie={single:"name",first:"given-name",middle:"additional-name",last:"family-name"},Pe={line1:"address-line1",line2:"address-line2",city:"address-level2",region:"address-level1",postalCode:"postal-code"},Fe=[["month","Month",2,"bday-month"],["day","Day",2,"bday-day"],["year","Year",4,"bday-year"]],De=r=>{let[e,t,n]=r.map(a=>a.value.trim());if(!e&&!t&&!n)return"";let o=a=>/^\d$/.test(a)?`0${a}`:a;return`${n}-${o(e)}-${o(t)}`},$=(r,e,t)=>r.setAttribute("aria-describedby",e?`${e.id} ${t.id}`:t.id),He="feedback@canopyds.com",Re=0,M=class extends Error{constructor(e){super(e),this.name="InactiveFormError"}},I=class extends Error{constructor(e){super(e),this.name="HostedOnlyFormError"}},P=class{constructor(e,t){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.formEl=null;this.submitButton=null;this.instanceId=`canopy-${Re++}`;this.container=e,this.options=t}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){if(console.error(e),e instanceof M){this.renderInactive();return}if(e instanceof I){this.renderHostedOnly();return}this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var o;let e=this.options.baseUrl||"",t=this.options.formId||((o=this.formDefinition)==null?void 0:o.formId);if(!t)throw new Error("Form configuration error: no formId");let n=await fetch(`${e}/api/embed/${t}`,{method:"GET",credentials:"omit"});if(!n.ok){if(n.status===403)try{let a=await n.json();if((a==null?void 0:a.code)==="FORM_INACTIVE")throw new M(a.error||"Form is inactive");if((a==null?void 0:a.code)==="FORM_HOSTED_ONLY")throw new I(a.error||"Form is only available at its hosted URL")}catch(a){if(a instanceof M||a instanceof I)throw a}throw new Error("Failed to load form definition")}return n.json()}renderFromDefinition(e){this.container.classList.add("canopy-root"),this.formDefinition=e,this.render(e)}render(e){this.container.innerHTML="",this.fieldElements.clear();let t=ee(e.defaultTheme,this.options.themeOverrides);te(this.container,t),re([t.bodyFont,t.titleFont,t.labelFont],this.options.baseUrl||""),!t.bodyFont&&!t.titleFont&&!t.labelFont&&ae(t.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(ne(t));let n=e.fields&&e.fields.length>0,o=e.title||e.description;if(!n&&!o){this.renderSkeleton();return}if(e.title||e.description){let h=document.createElement("div");if(h.className="canopy-header",e.title){let m=document.createElement("h2");m.className="canopy-title",m.textContent=e.title,h.appendChild(m)}if(e.description){let m=document.createElement("p");m.className="canopy-description",m.textContent=e.description,h.appendChild(m)}this.container.appendChild(h)}let a=document.createElement("div");a.className="canopy-status",a.setAttribute("role","alert"),a.setAttribute("aria-live","assertive"),this.statusEl=a;let p=document.createElement("form");p.className="canopy-form",p.addEventListener("submit",h=>this.handleSubmit(h)),this.formEl=p,e.fields.forEach(h=>{let{wrapper:m,input:f,errorEl:b}=this.createField(h);m&&(m.dataset.fieldName=h.name,p.appendChild(m)),this.fieldElements.set(h.name,{input:f,errorEl:b})}),this.options.preview&&(p.setAttribute("autocomplete","off"),p.querySelectorAll("input, select, textarea").forEach(h=>h.setAttribute("autocomplete","off")));let i=document.createElement("button");i.type="submit",i.className="canopy-submit",i.textContent=t.buttonText||"Submit",this.options.preview&&(i.classList.add("canopy-submit-preview"),i.setAttribute("data-preview-tooltip","For preview only. No submission will be created"));let d=getComputedStyle(this.container),l=d.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",y=d.getPropertyValue("--canopy-button-text").trim()||"#ffffff",g=d.getPropertyValue("--canopy-radius").trim()||"8px",s=d.getPropertyValue("--canopy-button-width").trim()||"100%";i.style.cssText=`
      display: block !important;
      width: ${s} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${g} !important;
      padding: 10px 16px !important;
      font-family: var(--canopy-font, inherit) !important;
      font-size: var(--canopy-font-size, 16px) !important;
      font-weight: 600 !important;
      background: ${l} !important;
      background-color: ${l} !important;
      color: ${y} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=i;let c=document.createElement("div");c.className="canopy-form-actions",c.appendChild(i),p.appendChild(c),this.container.appendChild(a),this.container.appendChild(p),this.container.appendChild(this.renderWatermark(e))}renderWatermark(e){let t=document.createElement("div");t.className="canopy-watermark";let n=document.createElement("span");n.className="canopy-watermark-brand",n.textContent="Powered by Canopy Forms (Beta)",t.appendChild(n);let o=document.createElement("span");o.className="canopy-watermark-sep",o.setAttribute("aria-hidden","true"),o.textContent="\xB7",t.appendChild(o);let a=(e==null?void 0:e.title)||(e==null?void 0:e.name)||(e==null?void 0:e.formId)||"unknown form",p=(e==null?void 0:e.formId)||"unknown",i=`Canopy Forms issue \u2014 ${a}`,d=[`Form: ${a}`,`Form ID: ${p}`,"","Describe the issue:",""].join(`
`),l=`mailto:${He}?subject=${encodeURIComponent(i)}&body=${encodeURIComponent(d)}`,y=document.createElement("a");return y.className="canopy-watermark-link",y.href=l,y.textContent="Report an issue",y.rel="noopener",t.appendChild(y),t}createField(e){var l,y,g;let t=`${this.instanceId}-${e.name}`,n=document.createElement("div");n.className="canopy-field";let o=document.createElement("label");if(o.className="canopy-label",o.dataset.fieldPart="label",o.htmlFor=t,o.textContent=e.label||e.name,e.required){let s=document.createElement("span");s.className="canopy-required",s.textContent=" *",s.setAttribute("aria-hidden","true"),o.appendChild(s)}let a;switch(e.type){case"TEXTAREA":{let s=document.createElement("textarea");s.className="canopy-textarea";let c=S(e);if(c){let h=Math.min(Math.max(Math.ceil(c/60),4),15);s.rows=h}else s.rows=4;a=s;break}case"DROPDOWN":{let s=z(e.options),c=Array.isArray(e.options)||(l=e.options)==null?void 0:l.defaultValue,h=s.some(u=>u.value===c),m=B(e.options),f=document.createElement("select");f.className="canopy-select";let b=document.createElement("option");if(b.value="",b.textContent=V,b.disabled=!0,b.selected=!h,f.appendChild(b),s.forEach(u=>{let x=document.createElement("option");x.value=u.value,x.textContent=u.label,h&&u.value===c&&(x.selected=!0),f.appendChild(x)}),m){let u=document.createElement("option");u.value=N,u.textContent=_,f.appendChild(u)}if(a=f,m){let u=this.createOtherInput(e);f.addEventListener("change",()=>{f.value===N?(u.style.setProperty("display","block","important"),e.required&&(u.required=!0)):(u.style.setProperty("display","none","important"),u.required=!1,u.value="")}),f.__otherInput=u}break}case"CHECKBOX":{let s=document.createElement("label");s.className="canopy-checkbox";let c=document.createElement("input");c.type="checkbox",c.id=t,c.name=e.name,e.required&&c.setAttribute("aria-required","true"),c.addEventListener("change",()=>{c.setCustomValidity("")}),s.appendChild(c);let h=document.createElement("span");h.dataset.fieldPart="label",h.textContent=e.label||e.name,s.appendChild(h),n.appendChild(s);let m=this.createHelpText(e,t);m&&n.appendChild(m);let f=document.createElement("span");return f.className="canopy-error",f.id=`${t}-error`,n.appendChild(f),$(c,m,f),c.setAttribute("aria-invalid","false"),{wrapper:n,input:c,errorEl:f}}case"CHECKBOXES":{let s=document.createElement("div");s.className="canopy-checkboxes",s.setAttribute("data-checkbox-group",e.name);let c=()=>{let u=s.querySelector("input[type=checkbox]");u&&u.setCustomValidity("")},h=(u,x,E)=>{let A=document.createElement("label");A.className="canopy-checkbox",A.dataset.fieldPart=E;let w=document.createElement("input");w.type="checkbox",w.name=e.name,w.value=u,w.addEventListener("change",c);let Z=document.createElement("span");return Z.textContent=x,A.appendChild(w),A.appendChild(Z),s.appendChild(A),w};if(z(e.options).forEach((u,x)=>{h(u.value,u.label,`option-${x}`)}),B(e.options)){let u=h(N,_,"option-other"),x=this.createOtherInput(e);x.dataset.choiceOther=e.name,x.addEventListener("input",c),u.addEventListener("change",()=>{u.checked?(x.style.setProperty("display","block","important"),x.focus()):(x.style.setProperty("display","none","important"),x.value="")}),s.appendChild(x)}let m=document.createElement("input");m.type="hidden",m.id=t,m.name=e.name,o.id=`${t}-label`,s.setAttribute("role","group"),s.setAttribute("aria-labelledby",o.id);let f=this.createHelpText(e,t);n.appendChild(o),f&&n.appendChild(f),n.appendChild(s);let b=document.createElement("span");return b.className="canopy-error",b.id=`${t}-error`,n.appendChild(b),$(s,f,b),m.setAttribute("aria-invalid","false"),{wrapper:n,input:m,errorEl:b}}case"EMAIL":{let s=document.createElement("input");s.type="email",s.setAttribute("autocomplete","email"),s.className="canopy-input",a=s;break}case"PHONE":{let s=document.createElement("input");s.type="tel",s.setAttribute("inputmode","tel"),s.setAttribute("autocomplete","tel"),s.className="canopy-input",a=s;break}case"DATE":{let s=document.createElement("input");s.type="date",s.className="canopy-input",((y=e.validation)==null?void 0:y.minDate)==="today"&&(s.min=O()),((g=e.validation)==null?void 0:g.maxDate)==="today"&&(s.max=O()),a=s;break}case"NUMBER":{let s=document.createElement("input");s.type="number",s.className="canopy-input";let c=e.validation;s.setAttribute("step",c!=null&&c.integer?"1":"any"),(c==null?void 0:c.min)!==void 0&&c.min<0||s.setAttribute("inputmode",c!=null&&c.integer?"numeric":"decimal"),(c==null?void 0:c.min)!==void 0&&s.setAttribute("min",String(c.min)),(c==null?void 0:c.max)!==void 0&&s.setAttribute("max",String(c.max)),a=s;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);case"DATE_OF_BIRTH":return this.createDateOfBirthField(e);default:{let s=document.createElement("input");s.type="text",s.className="canopy-input",a=s}}a.id=t,a.name=e.name,a.dataset.fieldPart="input",a.setAttribute("aria-invalid","false"),e.required&&a.setAttribute("aria-required","true");let p=S(e);p&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=p),a.addEventListener("input",()=>{a.setCustomValidity("")});let i=document.createElement("span");i.className="canopy-error",i.id=`${t}-error`;let d=this.createHelpText(e,t);return n.appendChild(o),d&&n.appendChild(d),n.appendChild(a),$(a,d,i),a.__otherInput&&n.appendChild(a.__otherInput),n.appendChild(i),{wrapper:n,input:a,errorEl:i}}createHelpText(e,t){if(!e.helpText)return null;let n=document.createElement("p");return n.className="canopy-help-text",n.id=`${t}-help`,n.textContent=e.helpText,n}createOtherInput(e){let t=document.createElement("input");return t.type="text",t.className="canopy-input canopy-choice-other",t.name=`${e.name}_other`,t.placeholder="Please specify...",t.maxLength=200,t.setAttribute("aria-label",`${e.label||e.name}: ${_}`),t.style.setProperty("display","none","important"),t.addEventListener("input",()=>{t.setCustomValidity("")}),t}createNameField(e){let t=`${this.instanceId}-${e.name}`,n=document.createElement("div");n.className="canopy-field canopy-name-group",n.setAttribute("role","group");let o=e.options||{},a=ie(o.parts||k),p=D(o,e.required),i=e.label||W,d=a.includes("single"),l=this.createHelpText(e,t);if(d)n.setAttribute("aria-label",i);else{let c=document.createElement("span");c.id=`${t}-group-label`,c.className="canopy-label",c.dataset.fieldPart="label",c.textContent=i,n.appendChild(c),l&&n.appendChild(l),n.setAttribute("aria-labelledby",c.id)}let y=document.createElement("div");y.className="canopy-name-parts";let g=document.createElement("input");g.type="hidden",g.id=t,g.name=e.name;let s=document.createElement("span");return s.className="canopy-error",s.id=`${t}-error`,a.forEach(c=>{let h=document.createElement("div");h.className=c==="middleInitial"?"canopy-name-part canopy-name-part-initial":"canopy-name-part";let m=document.createElement("label");m.className=d?"canopy-label":"canopy-name-part-label";let f=`${t}-${c}`;m.htmlFor=f,m.textContent=d?i:R(c,o.partLabels),m.dataset.fieldPart=d?"label":`label-${c}`;let b=p.includes(c);if(b){let E=document.createElement("span");E.className="canopy-required",E.textContent=" *",E.setAttribute("aria-hidden","true"),m.appendChild(E)}let u=document.createElement("input");u.type="text",u.className="canopy-input",u.id=f,u.name=`${e.name}.${c}`,u.setAttribute("data-name-part",c),u.setAttribute("data-name-field",e.name),u.maxLength=H(c);let x=Ie[c];x&&u.setAttribute("autocomplete",x),b&&u.setAttribute("aria-required","true"),u.addEventListener("input",()=>{y.querySelectorAll("input[data-name-part]").forEach(E=>E.setCustomValidity(""))}),h.appendChild(m),d&&l&&h.appendChild(l),h.appendChild(u),y.appendChild(h)}),n.appendChild(y),$(n,l,s),n.appendChild(s),{wrapper:n,input:g,errorEl:s}}createAddressField(e){let t=`${this.instanceId}-${e.name}`,n=e.options||{},o=document.createElement("div");o.className="canopy-field canopy-address-group",o.setAttribute("role","group"),o.setAttribute("aria-labelledby",`${t}-group-label`);let a=document.createElement("span");a.id=`${t}-group-label`,a.className="canopy-label",a.dataset.fieldPart="label",a.textContent=e.label||"Address",o.appendChild(a);let p=this.createHelpText(e,t);p&&o.appendChild(p);let i=document.createElement("div");i.className="canopy-address-parts";let d=document.createElement("input");d.type="hidden",d.id=t,d.name=e.name;let l=document.createElement("span");l.className="canopy-error",l.id=`${t}-error`;let y={postalCode:{maxlength:"10",inputmode:"numeric"}},g=U(n,e.required);return L(n).forEach(s=>{let c=g.includes(s),h=document.createElement("div");h.className=`canopy-address-part canopy-address-part-${s}`;let m=document.createElement("label");m.className="canopy-address-part-label";let f=`${t}-${s}`;if(m.htmlFor=f,m.textContent=T(s,n.partLabels),m.dataset.fieldPart=`label-${s}`,c){let u=document.createElement("span");u.className="canopy-required",u.textContent=" *",u.setAttribute("aria-hidden","true"),m.appendChild(u)}let b;if(s==="region"){let u=document.createElement("select");u.className="canopy-select";let x=document.createElement("option");x.value="",x.textContent=V,u.appendChild(x),fe.forEach(E=>{let A=document.createElement("option");A.value=E.value,A.textContent=E.label,u.appendChild(A)}),u.addEventListener("change",()=>{i.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(E=>E.setCustomValidity(""))}),b=u}else{let u=document.createElement("input");u.type="text",u.className="canopy-input",u.maxLength=q,y[s]&&Object.entries(y[s]).forEach(([x,E])=>u.setAttribute(x,E)),u.addEventListener("input",()=>{i.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(x=>x.setCustomValidity(""))}),b=u}b.id=f,b.setAttribute("autocomplete",Pe[s]),b.setAttribute("data-address-part",s),b.setAttribute("data-address-field",e.name),c&&b.setAttribute("aria-required","true"),h.appendChild(m),h.appendChild(b),i.appendChild(h)}),o.appendChild(i),$(o,p,l),o.appendChild(l),{wrapper:o,input:d,errorEl:l}}createDateOfBirthField(e){let t=`${this.instanceId}-${e.name}`,n=document.createElement("div");n.className="canopy-field canopy-dob-group",n.setAttribute("role","group");let o=document.createElement("span");if(o.id=`${t}-group-label`,o.className="canopy-label",o.dataset.fieldPart="label",o.textContent=e.label||e.name,e.required){let l=document.createElement("span");l.className="canopy-required",l.textContent=" *",l.setAttribute("aria-hidden","true"),o.appendChild(l)}n.appendChild(o),n.setAttribute("aria-labelledby",o.id);let a=this.createHelpText(e,t);a&&n.appendChild(a);let p=document.createElement("div");p.className="canopy-dob-parts";let i=document.createElement("input");i.type="hidden",i.id=t,i.name=e.name;let d=document.createElement("span");return d.className="canopy-error",d.id=`${t}-error`,Fe.forEach(([l,y,g,s])=>{let c=document.createElement("div");c.className=`canopy-dob-part canopy-dob-part-${l}`;let h=`${t}-${l}`,m=document.createElement("label");m.className="canopy-dob-part-label",m.htmlFor=h,m.textContent=y;let f=document.createElement("input");f.type="text",f.className="canopy-input",f.id=h,f.name=`${e.name}.${l}`,f.maxLength=g,f.setAttribute("inputmode","numeric"),f.setAttribute("autocomplete",s),f.setAttribute("data-dob-part",l),f.setAttribute("data-dob-field",e.name),e.required&&f.setAttribute("aria-required","true"),f.addEventListener("input",()=>this.partsOf(e.name).forEach(b=>b.setCustomValidity(""))),c.appendChild(m),c.appendChild(f),p.appendChild(c)}),n.appendChild(p),$(n,a,d),n.appendChild(d),{wrapper:n,input:i,errorEl:d}}partsOf(e){return this.container.querySelectorAll(`input[data-name-field="${e}"], input[data-address-field="${e}"], select[data-address-field="${e}"], input[data-dob-field="${e}"]`)}collectValues(){let e={};return this.fieldElements.forEach((t,n)=>{if(t.input instanceof HTMLInputElement)if(t.input.type==="checkbox")e[n]=t.input.checked;else if(t.input.type==="hidden"){let o=this.container.querySelector(`[data-checkbox-group="${n}"]`),a=this.container.querySelectorAll(`input[data-dob-field="${n}"]`);if(a.length>0)e[n]=De([...a]);else if(o){let p=[];o.querySelectorAll("input[type=checkbox]:checked").forEach(i=>{var l;if(i.value!==N){p.push(i.value);return}let d=(l=o.querySelector("[data-choice-other]"))==null?void 0:l.value.trim();d&&p.push(d)}),e[n]=p}else{let p=this.container.querySelectorAll(`input[data-name-field="${n}"]`);if(p.length>0){let i={};p.forEach(d=>{let l=d,y=l.getAttribute("data-name-part");y&&(i[y]=l.value)}),e[n]=i}else{let i=this.container.querySelectorAll(`input[data-address-field="${n}"], select[data-address-field="${n}"]`);if(i.length>0){let d={};i.forEach(l=>{let y=l.getAttribute("data-address-part");y&&(d[y]=l.value)}),e[n]=d}else e[n]=t.input.value}}}else e[n]=t.input.value;else t.input instanceof HTMLSelectElement&&t.input.value===N&&t.input.__otherInput?e[n]=t.input.__otherInput.value:e[n]=t.input.value}),e}findFailingInput(e){var p;let t=[...this.container.querySelectorAll(`input[data-dob-field="${e}"]`)];if(t.length>0){let[i,,d]=t;return(p=t.find(l=>!l.value.trim()))!=null?p:/^\d{4}$/.test(d.value.trim())?i:d}let n=this.container.querySelectorAll(`input[data-name-field="${e}"]`),o=i=>i.getAttribute("aria-required")==="true"&&!i.value.trim()||i instanceof HTMLInputElement&&i.maxLength>0&&i.value.length>i.maxLength;if(n.length>0){for(let i of n)if(o(i))return i;return n[0]}let a=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(a.length>0){for(let i of a)if(o(i))return i;for(let i of a)if(i.getAttribute("data-address-part")==="postalCode")return i;return a[0]}return null}showErrors(e){this.fieldElements.forEach((n,o)=>{let a=e[o]||"";if(n.input.type==="hidden"){let p=this.container.querySelector(`[data-checkbox-group="${o}"]`);if(p){let i=p.querySelector("input[type=checkbox]");i&&i.setCustomValidity(a)}else{let i=a?this.findFailingInput(o):null;i?i.setCustomValidity(a):this.partsOf(o).forEach(d=>d.setCustomValidity(""))}}else n.input.setCustomValidity(a);n.errorEl.textContent=a,n.input.setAttribute("aria-invalid",a?"true":"false")});let t=Object.keys(e);if(t.length>0){let n=this.fieldElements.get(t[0]);if(n)if(n.input.type==="hidden"){let o=this.container.querySelector(`[data-checkbox-group="${t[0]}"]`);if(o){let a=o.querySelector("input[type=checkbox]");a&&(a.reportValidity(),a.focus())}else{let a=this.findFailingInput(t[0]);a&&(a.reportValidity(),a.focus())}}else n.input.reportValidity(),n.input.focus()}}setStatus(e,t){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${t}`)}async handleSubmit(e){var o,a,p;if(e.preventDefault(),!this.formDefinition||this.options.preview)return;this.setStatus("","info"),this.fieldElements.forEach((i,d)=>{if(i.input.setCustomValidity(""),i.input.type==="hidden"){let l=this.container.querySelector(`[data-checkbox-group="${d}"]`);if(l){let y=l.querySelector("input[type=checkbox]");y&&y.setCustomValidity("")}else this.partsOf(d).forEach(y=>y.setCustomValidity(""))}});let t=this.collectValues(),n=ye(this.formDefinition.fields,t);if(this.showErrors(n),Object.keys(n).length>0){let i=Object.keys(n).length;this.setStatus(`Please fix ${i} field${i>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let i=this.options.baseUrl||"",d=this.options.formId||((o=this.formDefinition)==null?void 0:o.formId);if(!d){this.setStatus("Form configuration error.","error");return}let l=await fetch(`${i}/api/embed/${d}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),y=await l.json();if(!l.ok){y!=null&&y.fields&&this.showErrors(y.fields),this.setStatus((y==null?void 0:y.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}e.target.reset(),this.renderSuccess(this.formDefinition.successMessage||"Thanks for your submission!")}catch(i){console.error(i),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let i=((p=(a=this.formDefinition)==null?void 0:a.defaultTheme)==null?void 0:p.buttonText)||"Submit";this.submitButton.textContent=i,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderSuccess(e){this.statusEl&&(this.statusEl.textContent="",this.statusEl.className="canopy-status"),this.formEl&&(this.formEl.style.display="none");let t=this.container.querySelector(".canopy-success");t&&t.remove();let n=document.createElement("div");n.className="canopy-success",n.setAttribute("role","status"),n.setAttribute("aria-live","polite");let o=document.createElement("div");o.className="canopy-success-icon",o.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',n.appendChild(o);let a=document.createElement("p");a.className="canopy-success-message",a.textContent=e,n.appendChild(a);let p=document.createElement("button");p.type="button",p.className="canopy-success-reset",p.textContent="Submit another response",p.addEventListener("click",()=>{this.formDefinition&&this.render(this.formDefinition)}),n.appendChild(p),this.container.appendChild(n)}renderSkeleton(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-skeleton";let t=[{labelW:"30%",type:"input"},{labelW:"45%",type:"input"},{labelW:"25%",type:"textarea"}],n=0,o=document.createElement("div");o.className="canopy-skeleton-bar canopy-skeleton-title",o.style.animationDelay=`${n}s`,e.appendChild(o),n+=.15;let a=document.createElement("div");a.className="canopy-skeleton-bar canopy-skeleton-desc",a.style.animationDelay=`${n}s`,e.appendChild(a),n+=.15;for(let i of t){let d=document.createElement("div");d.className="canopy-skeleton-field";let l=document.createElement("div");l.className="canopy-skeleton-bar canopy-skeleton-label",l.style.width=i.labelW,l.style.animationDelay=`${n}s`,d.appendChild(l),n+=.1;let y=document.createElement("div");y.className=`canopy-skeleton-bar canopy-skeleton-${i.type}`,y.style.animationDelay=`${n}s`,d.appendChild(y),n+=.15,e.appendChild(d)}let p=document.createElement("div");p.className="canopy-skeleton-bar canopy-skeleton-button",p.style.animationDelay=`${n}s`,e.appendChild(p),this.container.appendChild(e)}renderError(e){this.container.innerHTML="";let t=document.createElement("div");t.className="canopy-status canopy-status-error",t.textContent=e,this.container.appendChild(t),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderInactive(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let t=document.createElement("h2");t.className="canopy-inactive-heading",t.textContent="Form Not Available",e.appendChild(t);let n=document.createElement("p");n.className="canopy-inactive-body",n.textContent="This form is not currently accepting responses. Please contact the form owner if you believe this is an error.",e.appendChild(n),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderHostedOnly(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let t=document.createElement("h2");t.className="canopy-inactive-heading",t.textContent="Form Not Available",e.appendChild(t);let n=document.createElement("p");n.className="canopy-inactive-body",n.textContent="This form is only available at its hosted URL and cannot be embedded. Please contact the form owner.",e.appendChild(n),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}};var he=`
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
`;var be="canopy-embed-styles";function qe(){if(document.getElementById(be))return;let r=document.createElement("style");r.id=be,r.textContent=he,document.head.appendChild(r)}function _e(r){var e;return r.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function ze(r){let e=r.dataset.theme;if(e)try{return JSON.parse(e)}catch(t){console.warn("Canopy Forms: invalid data-theme JSON");return}}function K(){qe(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let t=e.dataset.canopyForm;if(!t){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let n=ze(e),o=_e(e);new P(e,{formId:t,themeOverrides:n,baseUrl:o}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",K):K();window.CanopyForms={init:K,CanopyForm:P};})();
