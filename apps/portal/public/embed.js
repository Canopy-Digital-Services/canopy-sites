"use strict";(()=>{var x={fontSize:16,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:4,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:28,titleWeight:"normal",titleAlign:"left",labelSize:18,labelWeight:"normal"},N=new Set;function v(n,e){if(!n)return e;let t=n.trim();return t?/^var\(/i.test(t)||/^rgb/i.test(t)||/^hsl/i.test(t)||/^color\(/i.test(t)||/^(transparent|currentcolor|inherit)$/i.test(t)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(t)?t:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(t)?`#${t}`:e:e}function X(n){if(!n)return{};let{headingFont:e,...t}=n;return e?{titleFont:e,labelFont:e,...t}:t}function K(n,e){return{...x,...X(n),...X(e)}}function fe(n){let e=/^#?([0-9a-f]{6})$/i.exec(n.trim());if(!e)return null;let t=parseInt(e[1],16);return[t>>16&255,t>>8&255,t&255]}function he(n,e,t){let[r,i,a]=[n,e,t].map(p=>{let l=p/255;return l<=.03928?l/12.92:Math.pow((l+.055)/1.055,2.4)});return .2126*r+.7152*i+.0722*a}function j(n){let e=fe(n);return e?he(...e):null}function be(n,e){let t=j(n);if(t===null||t<=.179)return"#ffffff";let r=j(e);return r!==null&&(t+.05)/(r+.05)>=4.5?e:x.text}function Z(n,e){var c,o,s,y,u,h;let t=G(e.bodyFont,e.fontFamily);n.style.setProperty("--canopy-font",t);for(let[d,m]of[["--canopy-title-font",e.titleFont],["--canopy-label-font",e.labelFont]]){let b=G(m);n.style.setProperty(d,b==="inherit"?"var(--canopy-font)":b)}n.style.setProperty("--canopy-font-size",`${(c=e.fontSize)!=null?c:x.fontSize}px`);let r=v(e.text,x.text);n.style.setProperty("--canopy-text",r),n.style.setProperty("--canopy-bg",v(e.background,x.background)),n.style.setProperty("--canopy-field-bg",v(e.fieldBackground,x.fieldBackground));let i=v(e.primary,x.primary);n.style.setProperty("--canopy-primary",i),n.style.setProperty("--canopy-button-text",v(e.buttonTextColor,"")||be(i,r)),n.style.setProperty("--canopy-border",v(e.border,x.border)),n.style.setProperty("--canopy-radius",`${(o=e.radius)!=null?o:x.radius}px`),n.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),n.style.setProperty("--canopy-button-align",e.buttonAlign||x.buttonAlign);let a={sm:"1.25em",md:"1.5em",lg:"1.875em",xl:"2.25em"},p=(d,m)=>{var f;let b=Number(d);return b>0?`${b}px`:(f=a[String(d)])!=null?f:`${Number(m)}px`};n.style.setProperty("--canopy-title-size",p(e.titleSize,x.titleSize)),n.style.setProperty("--canopy-label-size",p(e.labelSize,x.labelSize));let l={light:"300",normal:"400",medium:"500",bold:"700",semibold:"700"};n.style.setProperty("--canopy-title-weight",(y=l[(s=e.titleWeight)!=null?s:"normal"])!=null?y:"400"),n.style.setProperty("--canopy-label-weight",(h=l[(u=e.labelWeight)!=null?u:"normal"])!=null?h:"400");for(let[d,m]of[["--canopy-title-color",e.titleColor],["--canopy-label-color",e.labelColor]]){let b=m?v(m,""):"";b?n.style.setProperty(d,b):n.style.removeProperty(d)}n.style.setProperty("--canopy-title-align",e.titleAlign==="center"?"center":"left")}function Y(n){switch(n.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function G(n,e){return n&&n!=="inherit"?`'${n}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function J(n,e){let t=n.filter(p=>!!p&&p!=="inherit"&&!N.has(p));if(t.length===0)return;let r=t.map(p=>`family=${encodeURIComponent(p)}`).join("&"),i=`${e}/api/fonts?${r}`,a=document.createElement("link");a.rel="stylesheet",a.href=i,a.dataset.canopyFont="true",document.head.appendChild(a),t.forEach(p=>N.add(p))}function Q(n){if(!n||N.has(n))return;let e=document.createElement("link");e.rel="stylesheet",e.href=n,e.dataset.canopyFont="true",document.head.appendChild(e),N.add(n)}var z="Name",ge={first:"First",middle:"Middle",middleInitial:"M.I.",last:"Last",single:z},A=["first","last"],ee=["first","middle","middleInitial","last","single"];function te(n){return[...n].sort((e,t)=>ee.indexOf(e)-ee.indexOf(t))}function $(n,e){var r;if(n!=null&&n.requiredParts)return n.requiredParts;let t=(r=n==null?void 0:n.parts)!=null?r:A;return e?t.filter(i=>i!=="middle"&&i!=="middleInitial"):[]}function M(n){return n==="middleInitial"?2:100}function I(n,e){return(e==null?void 0:e[n])||ge[n]||n}var xe={line1:"Street",line2:"Apt, suite",city:"City",region:"State",postalCode:"ZIP"},ne=["line1","line2","city","region","postalCode"];function D(n){var t;let e=(t=n==null?void 0:n.parts)!=null?t:ne;return ne.filter(r=>e.includes(r))}function T(n,e){return(e==null?void 0:e[n])||xe[n]||n}function _(n,e){return n!=null&&n.requiredParts?n.requiredParts:e?D(n).filter(t=>t!=="line2"):[]}var O=200,Ee=/^\d{5}(-\d{4})?$/;function re(n,e,t){let r=D(e),i=_(e,t),a=l=>{var c;return String((c=n==null?void 0:n[l])!=null?c:"")},p=l=>a(l).trim();for(let l of r){if(i.includes(l)&&!p(l))return`${T(l,e==null?void 0:e.partLabels)} is required.`;if(a(l).length>O)return`${T(l,e==null?void 0:e.partLabels)} must be at most ${O} characters.`}return r.includes("postalCode")&&p("postalCode")&&!Ee.test(p("postalCode"))?`${T("postalCode",e==null?void 0:e.partLabels)} must be a US ZIP code, like 12345 or 12345-6789.`:null}var ae="Choose one...",P="Other",C="__other__";function F(n){let e=Array.isArray(n)?n:n==null?void 0:n.options;return Array.isArray(e)?e.filter(t=>typeof t=="object"&&t!==null&&typeof t.value=="string"):[]}function H(n){return!Array.isArray(n)&&(n==null?void 0:n.allowOther)===!0}function W(n,e,t,r){let i=n==="CHECKBOXES"?e:typeof e=="string"?[e]:null;if(!Array.isArray(i))return`${r} must be one of its options.`;let a=F(t).map(l=>l.value),p=i.map(String).filter(l=>!a.includes(l));return p.length===0?null:!H(t)||p.length>1?`${r} must be one of its options.`:p[0].length>200?`${r} must be 200 characters or fewer.`:null}var le={TEXT:200,EMAIL:254,TEXTAREA:2e3},ve={TEXT:500,EMAIL:320,TEXTAREA:1e4,PHONE:30,NUMBER:50,DATE:30};function U(n){return typeof n.validation=="object"&&n.validation!==null?n.validation:{}}function w(n){let e=le[n.type],t=ve[n.type];if(e===void 0)return t;let r=U(n).maxLength,i=Number.isInteger(r)&&r>0?r:e;return t!==void 0?Math.min(i,t):i}var Ce=/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;function Ae(n){return n.length>320||/[\r\n]/.test(n)?!1:Ce.test(n)}function Te(n){let e=n.replace(/[^\d+]/g,"");if(e.startsWith("+1"))e=e.substring(2);else{if(e.startsWith("+"))return null;e.startsWith("1")&&e.length===11&&(e=e.substring(1))}return/^\d{10}$/.test(e)?e:null}function R(n=new Date){let e=(t,r=2)=>String(t).padStart(r,"0");return`${e(n.getFullYear(),4)}-${e(n.getMonth()+1)}-${e(n.getDate())}`}function ce(){let n=R();return{earliest:n,latest:n}}function pe(n){if(/^\d{4}-\d{2}-\d{2}$/.test(n)){let t=new Date(`${n}T00:00:00Z`);return!isNaN(t.getTime())&&t.toISOString().slice(0,10)===n?n:null}let e=new Date(n);return isNaN(e.getTime())?null:R(e)}function oe(n){return new Date(`${n}T00:00:00`).toLocaleDateString()}function ie(n,e){return n?n==="today"?e:pe(n):null}function B(n,e,t){return e!==void 0&&n.length>e?`${t} must be at most ${e} characters.`:null}function se(n,e,t){let{minLength:r}=U(n);return r&&e.length<r?`${t} must be at least ${r} characters.`:B(e,w(n),t)}function we(n,e,t){switch(n){case"numbers":return/^\d+$/.test(e)?null:`${t} must contain only numbers.`;case"letters":return/^[A-Za-z]+$/.test(e)?null:`${t} must contain only letters.`;case"url":{try{if(new URL(e.startsWith("http")?e:`https://${e}`).hostname.includes("."))return null}catch(r){}return`${t} must be a valid URL.`}case"postal-us":return/^\d{5}(-\d{4})?$/.test(e)?null:`${t} must be a valid US postal code (e.g., 12345 or 12345-6789).`;case"postal-ca":return/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(e)?null:`${t} must be a valid Canadian postal code (e.g., K1A 0B1).`;default:return null}}function Le(n,e,t=ce()){var p,l;let r=n.label||n.name,i=U(n);switch(n.type){case"CHECKBOX":return n.required&&!e?`${r} is required.`:null;case"CHECKBOXES":if(!Array.isArray(e)||e.length===0){if(n.required)return`${r} is required.`;if(e==null||Array.isArray(e))return null}return W("CHECKBOXES",e,n.options,r);case"NAME":{let c=e,o=typeof n.options=="object"&&n.options!==null?n.options:{},s=$(o,n.required);for(let y of o.parts||A){let u=c==null?void 0:c[y],h=y==="single"?r:I(y,o.partLabels);if(s.includes(y)&&(!u||String(u).trim()===""))return`${h} is required.`;let d=B(String(u!=null?u:""),M(y),h);if(d)return d}return null}case"ADDRESS":return re(e,n.options,n.required)}if(e==null||String(e).trim()==="")return n.required?`${r} is required.`:null;let a=String(e);if(le[n.type]===void 0){let c=B(a,w(n),r);if(c)return c}switch(n.type){case"DROPDOWN":return W("DROPDOWN",e,n.options,r);case"PHONE":{let c=i.format||"lenient";return c==="lenient"&&!/^[\d\s\-\(\)\+\.]{7,}$/.test(a)?`${r} must be a valid phone number.`:c==="strict"&&!Te(a)?`${r} must be a valid US phone number (10 digits).`:null}case"DATE":{let c=pe(a);if(!c)return`${r} must be a valid date.`;let o=ie(i.minDate,t.earliest);if(o&&c<o)return`${r} must be on or after ${oe(o)}.`;let s=ie(i.maxDate,t.latest);return s&&c>s?`${r} must be on or before ${oe(s)}.`:null}case"NUMBER":{let c=Number(e);return isNaN(c)?`${r} must be a number.`:i.integer&&!Number.isInteger(c)?`${r} must be a whole number.`:i.min!==void 0&&c<i.min?`${r} must be at least ${i.min}.`:i.max!==void 0&&c>i.max?`${r} must be at most ${i.max}.`:null}case"EMAIL":{let c=a.trim();if(!Ae(c))return"Enter a valid email address";let o=c.split("@")[1].toLowerCase(),{allow:s,block:y}=(p=i.domainRules)!=null?p:{};return Array.isArray(s)&&s.length>0&&!s.some(u=>String(u).toLowerCase()===o)?`${r} must be from an allowed domain.`:Array.isArray(y)&&y.some(u=>String(u).toLowerCase()===o)?`${r} domain is not allowed.`:se(n,c,r)}default:return(l=se(n,a,r))!=null?l:we(i.format,a,r)}}function de(n,e,t=ce()){let r={};for(let i of n){let a=Le(i,e[i.name],t);a&&(r[i.name]=a)}return r}var ue=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var ke="feedback@canopyds.com",Ne=0,L=class extends Error{constructor(e){super(e),this.name="InactiveFormError"}},S=class extends Error{constructor(e){super(e),this.name="HostedOnlyFormError"}},k=class{constructor(e,t){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.formEl=null;this.submitButton=null;this.instanceId=`canopy-${Ne++}`;this.container=e,this.options=t}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){if(console.error(e),e instanceof L){this.renderInactive();return}if(e instanceof S){this.renderHostedOnly();return}this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var i;let e=this.options.baseUrl||"",t=this.options.formId||((i=this.formDefinition)==null?void 0:i.formId);if(!t)throw new Error("Form configuration error: no formId");let r=await fetch(`${e}/api/embed/${t}`,{method:"GET",credentials:"omit"});if(!r.ok){if(r.status===403)try{let a=await r.json();if((a==null?void 0:a.code)==="FORM_INACTIVE")throw new L(a.error||"Form is inactive");if((a==null?void 0:a.code)==="FORM_HOSTED_ONLY")throw new S(a.error||"Form is only available at its hosted URL")}catch(a){if(a instanceof L||a instanceof S)throw a}throw new Error("Failed to load form definition")}return r.json()}renderFromDefinition(e){this.container.classList.add("canopy-root"),this.formDefinition=e,this.render(e)}render(e){this.container.innerHTML="",this.fieldElements.clear();let t=K(e.defaultTheme,this.options.themeOverrides);Z(this.container,t),J([t.bodyFont,t.titleFont,t.labelFont],this.options.baseUrl||""),!t.bodyFont&&!t.titleFont&&!t.labelFont&&Q(t.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(Y(t));let r=e.fields&&e.fields.length>0,i=e.title||e.description;if(!r&&!i){this.renderSkeleton();return}if(e.title||e.description){let d=document.createElement("div");if(d.className="canopy-header",e.title){let m=document.createElement("h2");m.className="canopy-title",m.textContent=e.title,d.appendChild(m)}if(e.description){let m=document.createElement("p");m.className="canopy-description",m.textContent=e.description,d.appendChild(m)}this.container.appendChild(d)}let a=document.createElement("div");a.className="canopy-status",a.setAttribute("role","alert"),a.setAttribute("aria-live","assertive"),this.statusEl=a;let p=document.createElement("form");p.className="canopy-form",p.addEventListener("submit",d=>this.handleSubmit(d)),this.formEl=p,e.fields.forEach(d=>{let{wrapper:m,input:b,errorEl:f}=this.createField(d);m&&(m.dataset.fieldName=d.name,p.appendChild(m)),this.fieldElements.set(d.name,{input:b,errorEl:f})});let l=document.createElement("button");l.type="submit",l.className="canopy-submit",l.textContent=t.buttonText||"Submit",this.options.preview&&(l.classList.add("canopy-submit-preview"),l.setAttribute("data-preview-tooltip","For preview only. No submission will be created"));let c=getComputedStyle(this.container),o=c.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",s=c.getPropertyValue("--canopy-button-text").trim()||"#ffffff",y=c.getPropertyValue("--canopy-radius").trim()||"8px",u=c.getPropertyValue("--canopy-button-width").trim()||"100%";l.style.cssText=`
      display: block !important;
      width: ${u} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${y} !important;
      padding: 10px 16px !important;
      font-family: var(--canopy-font, inherit) !important;
      font-size: var(--canopy-font-size, 16px) !important;
      font-weight: 600 !important;
      background: ${o} !important;
      background-color: ${o} !important;
      color: ${s} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=l;let h=document.createElement("div");h.className="canopy-form-actions",h.appendChild(l),p.appendChild(h),this.container.appendChild(a),this.container.appendChild(p),this.container.appendChild(this.renderWatermark(e))}renderWatermark(e){let t=document.createElement("div");t.className="canopy-watermark";let r=document.createElement("span");r.className="canopy-watermark-brand",r.textContent="Powered by Canopy Forms (Beta)",t.appendChild(r);let i=document.createElement("span");i.className="canopy-watermark-sep",i.setAttribute("aria-hidden","true"),i.textContent="\xB7",t.appendChild(i);let a=(e==null?void 0:e.title)||(e==null?void 0:e.name)||(e==null?void 0:e.formId)||"unknown form",p=(e==null?void 0:e.formId)||"unknown",l=`Canopy Forms issue \u2014 ${a}`,c=[`Form: ${a}`,`Form ID: ${p}`,"","Describe the issue:",""].join(`
`),o=`mailto:${ke}?subject=${encodeURIComponent(l)}&body=${encodeURIComponent(c)}`,s=document.createElement("a");return s.className="canopy-watermark-link",s.href=o,s.textContent="Report an issue",s.rel="noopener",t.appendChild(s),t}createField(e){var c;let t=`${this.instanceId}-${e.name}`,r=document.createElement("div");r.className="canopy-field";let i=document.createElement("label");if(i.className="canopy-label",i.dataset.fieldPart="label",i.htmlFor=t,i.textContent=e.label||e.name,e.required){let o=document.createElement("span");o.className="canopy-required",o.textContent=" *",o.setAttribute("aria-hidden","true"),i.appendChild(o)}let a;switch(e.type){case"TEXTAREA":{let o=document.createElement("textarea");o.className="canopy-textarea";let s=w(e);if(s){let y=Math.min(Math.max(Math.ceil(s/60),4),15);o.rows=y}else o.rows=4;a=o;break}case"DROPDOWN":{let o=F(e.options),s=Array.isArray(e.options)||(c=e.options)==null?void 0:c.defaultValue,y=o.some(m=>m.value===s),u=H(e.options),h=document.createElement("select");h.className="canopy-select";let d=document.createElement("option");if(d.value="",d.textContent=e.placeholder||ae,d.disabled=!0,d.selected=!y,h.appendChild(d),o.forEach(m=>{let b=document.createElement("option");b.value=m.value,b.textContent=m.label,y&&m.value===s&&(b.selected=!0),h.appendChild(b)}),u){let m=document.createElement("option");m.value=C,m.textContent=P,h.appendChild(m)}if(a=h,u){let m=this.createOtherInput(e);h.addEventListener("change",()=>{h.value===C?(m.style.setProperty("display","block","important"),e.required&&(m.required=!0)):(m.style.setProperty("display","none","important"),m.required=!1,m.value="")}),h.__otherInput=m}break}case"CHECKBOX":{let o=document.createElement("label");o.className="canopy-checkbox";let s=document.createElement("input");s.type="checkbox",s.id=t,s.name=e.name,e.required&&s.setAttribute("aria-required","true"),s.addEventListener("change",()=>{s.setCustomValidity("")}),o.appendChild(s);let y=document.createElement("span");if(y.dataset.fieldPart="label",y.textContent=e.label||e.name,o.appendChild(y),r.appendChild(o),e.helpText){let h=document.createElement("p");h.className="canopy-help-text",h.textContent=e.helpText,r.appendChild(h)}let u=document.createElement("span");return u.className="canopy-error",u.id=`${t}-error`,r.appendChild(u),s.setAttribute("aria-describedby",u.id),s.setAttribute("aria-invalid","false"),{wrapper:r,input:s,errorEl:u}}case"CHECKBOXES":{let o=document.createElement("div");o.className="canopy-checkboxes",o.setAttribute("data-checkbox-group",e.name);let s=()=>{let d=o.querySelector("input[type=checkbox]");d&&d.setCustomValidity("")},y=(d,m,b)=>{let f=document.createElement("label");f.className="canopy-checkbox",f.dataset.fieldPart=b;let g=document.createElement("input");g.type="checkbox",g.name=e.name,g.value=d,g.addEventListener("change",s);let E=document.createElement("span");return E.textContent=m,f.appendChild(g),f.appendChild(E),o.appendChild(f),g};if(F(e.options).forEach((d,m)=>{y(d.value,d.label,`option-${m}`)}),H(e.options)){let d=y(C,P,"option-other"),m=this.createOtherInput(e);m.dataset.choiceOther=e.name,m.addEventListener("input",s),d.addEventListener("change",()=>{d.checked?(m.style.setProperty("display","block","important"),m.focus()):(m.style.setProperty("display","none","important"),m.value="")}),o.appendChild(m)}let u=document.createElement("input");if(u.type="hidden",u.id=t,u.name=e.name,r.appendChild(i),r.appendChild(o),e.helpText){let d=document.createElement("p");d.className="canopy-help-text",d.textContent=e.helpText,r.appendChild(d)}let h=document.createElement("span");return h.className="canopy-error",h.id=`${t}-error`,r.appendChild(h),u.setAttribute("aria-describedby",h.id),u.setAttribute("aria-invalid","false"),{wrapper:r,input:u,errorEl:h}}case"EMAIL":{let o=document.createElement("input");o.type="email",o.className="canopy-input",a=o;break}case"PHONE":{let o=document.createElement("input");o.type="tel",o.setAttribute("inputmode","tel"),o.setAttribute("autocomplete","tel"),o.className="canopy-input",a=o;break}case"DATE":{let o=document.createElement("input");o.type="date",o.className="canopy-input";let s=e.validation;s&&(s.minDate&&(o.min=this.resolveDate(s.minDate)),s.maxDate&&(o.max=this.resolveDate(s.maxDate))),a=o;break}case"NUMBER":{let o=document.createElement("input");o.type="number",o.className="canopy-input";let s=e.validation;s!=null&&s.integer?(o.setAttribute("inputmode","numeric"),o.setAttribute("step","1")):(o.setAttribute("inputmode","decimal"),o.setAttribute("step","any")),(s==null?void 0:s.min)!==void 0&&o.setAttribute("min",String(s.min)),(s==null?void 0:s.max)!==void 0&&o.setAttribute("max",String(s.max)),a=o;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);default:{let o=document.createElement("input");o.type="text",o.className="canopy-input",a=o}}a.id=t,a.name=e.name,a.dataset.fieldPart="input",a.setAttribute("aria-invalid","false"),e.required&&a.setAttribute("aria-required","true"),e.placeholder&&!(a instanceof HTMLSelectElement)&&a.setAttribute("placeholder",e.placeholder);let p=w(e);p&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=p),a.addEventListener("input",()=>{a.setCustomValidity("")});let l=document.createElement("span");if(l.className="canopy-error",l.id=`${t}-error`,a.setAttribute("aria-describedby",l.id),r.appendChild(i),r.appendChild(a),a.__otherInput&&r.appendChild(a.__otherInput),e.helpText){let o=document.createElement("p");o.className="canopy-help-text",o.textContent=e.helpText,r.appendChild(o)}return r.appendChild(l),{wrapper:r,input:a,errorEl:l}}createOtherInput(e){let t=document.createElement("input");return t.type="text",t.className="canopy-input canopy-choice-other",t.name=`${e.name}_other`,t.placeholder="Please specify...",t.maxLength=200,t.setAttribute("aria-label",`${e.label||e.name}: ${P}`),t.style.setProperty("display","none","important"),t.addEventListener("input",()=>{t.setCustomValidity("")}),t}resolveDate(e){return e==="today"?R():e}createNameField(e){let t=`${this.instanceId}-${e.name}`,r=document.createElement("div");r.className="canopy-field canopy-name-group",r.setAttribute("role","group");let i=e.options||{},a=te(i.parts||A),p=$(i,e.required),l=e.label||z,c=a.includes("single");if(c)r.setAttribute("aria-label",l);else{let u=document.createElement("span");u.id=`${t}-group-label`,u.className="canopy-label",u.dataset.fieldPart="label",u.textContent=l,r.appendChild(u),r.setAttribute("aria-labelledby",u.id)}let o=document.createElement("div");o.className="canopy-name-parts";let s=document.createElement("input");s.type="hidden",s.id=t,s.name=e.name;let y=document.createElement("span");if(y.className="canopy-error",y.id=`${t}-error`,a.forEach(u=>{let h=document.createElement("div");h.className=u==="middleInitial"?"canopy-name-part canopy-name-part-initial":"canopy-name-part";let d=document.createElement("label");d.className=c?"canopy-label":"canopy-name-part-label";let m=`${t}-${u}`;d.htmlFor=m,d.textContent=c?l:I(u,i.partLabels),d.dataset.fieldPart=c?"label":`label-${u}`;let b=p.includes(u);if(b){let g=document.createElement("span");g.className="canopy-required",g.textContent=" *",g.setAttribute("aria-hidden","true"),d.appendChild(g)}let f=document.createElement("input");f.type="text",f.className="canopy-input",f.id=m,f.name=`${e.name}.${u}`,f.setAttribute("data-name-part",u),f.setAttribute("data-name-field",e.name),f.maxLength=M(u),b&&f.setAttribute("aria-required","true"),f.addEventListener("input",()=>{o.querySelectorAll("input[data-name-part]").forEach(g=>g.setCustomValidity(""))}),h.appendChild(d),h.appendChild(f),o.appendChild(h)}),r.appendChild(o),e.helpText){let u=document.createElement("p");u.className="canopy-help-text",u.textContent=e.helpText,r.appendChild(u)}return r.appendChild(y),{wrapper:r,input:s,errorEl:y}}createAddressField(e){let t=`${this.instanceId}-${e.name}`,r=e.options||{},i=document.createElement("div");i.className="canopy-field canopy-address-group",i.setAttribute("role","group"),i.setAttribute("aria-labelledby",`${t}-group-label`);let a=document.createElement("span");a.id=`${t}-group-label`,a.className="canopy-label",a.dataset.fieldPart="label",a.textContent=e.label||"Address",i.appendChild(a);let p=document.createElement("div");p.className="canopy-address-parts";let l=document.createElement("input");l.type="hidden",l.id=t,l.name=e.name;let c=document.createElement("span");c.className="canopy-error",c.id=`${t}-error`;let o={postalCode:{maxlength:"10",inputmode:"numeric"}},s=_(r,e.required);if(D(r).forEach(y=>{let u=s.includes(y),h=document.createElement("div");h.className=`canopy-address-part canopy-address-part-${y}`;let d=document.createElement("label");d.className="canopy-address-part-label";let m=`${t}-${y}`;if(d.htmlFor=m,d.textContent=T(y,r.partLabels),d.dataset.fieldPart=`label-${y}`,u){let f=document.createElement("span");f.className="canopy-required",f.textContent=" *",f.setAttribute("aria-hidden","true"),d.appendChild(f)}let b;if(y==="region"){let f=document.createElement("select");f.className="canopy-select";let g=document.createElement("option");g.value="",g.textContent="Select...",f.appendChild(g),ue.forEach(E=>{let q=document.createElement("option");q.value=E.value,q.textContent=E.label,f.appendChild(q)}),f.addEventListener("change",()=>{p.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(E=>E.setCustomValidity(""))}),b=f}else{let f=document.createElement("input");f.type="text",f.className="canopy-input",f.maxLength=O,o[y]&&Object.entries(o[y]).forEach(([g,E])=>f.setAttribute(g,E)),f.addEventListener("input",()=>{p.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(g=>g.setCustomValidity(""))}),b=f}b.id=m,b.setAttribute("data-address-part",y),b.setAttribute("data-address-field",e.name),u&&b.setAttribute("aria-required","true"),h.appendChild(d),h.appendChild(b),p.appendChild(h)}),i.appendChild(p),e.helpText){let y=document.createElement("p");y.className="canopy-help-text",y.textContent=e.helpText,i.appendChild(y)}return i.appendChild(c),{wrapper:i,input:l,errorEl:c}}collectValues(){let e={};return this.fieldElements.forEach((t,r)=>{if(t.input instanceof HTMLInputElement)if(t.input.type==="checkbox")e[r]=t.input.checked;else if(t.input.type==="hidden"){let i=this.container.querySelector(`[data-checkbox-group="${r}"]`);if(i){let a=[];i.querySelectorAll("input[type=checkbox]:checked").forEach(p=>{var c;if(p.value!==C){a.push(p.value);return}let l=(c=i.querySelector("[data-choice-other]"))==null?void 0:c.value.trim();l&&a.push(l)}),e[r]=a}else{let a=this.container.querySelectorAll(`input[data-name-field="${r}"]`);if(a.length>0){let p={};a.forEach(l=>{let c=l,o=c.getAttribute("data-name-part");o&&(p[o]=c.value)}),e[r]=p}else{let p=this.container.querySelectorAll(`input[data-address-field="${r}"], select[data-address-field="${r}"]`);if(p.length>0){let l={};p.forEach(c=>{let o=c.getAttribute("data-address-part");o&&(l[o]=c.value)}),e[r]=l}else e[r]=t.input.value}}}else e[r]=t.input.value;else t.input instanceof HTMLSelectElement&&t.input.value===C&&t.input.__otherInput?e[r]=t.input.__otherInput.value:e[r]=t.input.value}),e}findFailingInput(e){let t=this.container.querySelectorAll(`input[data-name-field="${e}"]`),r=a=>a.getAttribute("aria-required")==="true"&&!a.value.trim()||a instanceof HTMLInputElement&&a.maxLength>0&&a.value.length>a.maxLength;if(t.length>0){for(let a of t)if(r(a))return a;return t[0]}let i=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(i.length>0){for(let a of i)if(r(a))return a;for(let a of i)if(a.getAttribute("data-address-part")==="postalCode")return a;return i[0]}return null}showErrors(e){this.fieldElements.forEach((r,i)=>{let a=e[i]||"";if(r.input.type==="hidden"){let p=this.container.querySelector(`[data-checkbox-group="${i}"]`);if(p){let l=p.querySelector("input[type=checkbox]");l&&l.setCustomValidity(a)}else{let l=a?this.findFailingInput(i):null;l?l.setCustomValidity(a):this.container.querySelectorAll(`input[data-name-field="${i}"], input[data-address-field="${i}"], select[data-address-field="${i}"]`).forEach(o=>o.setCustomValidity(""))}}else r.input.setCustomValidity(a);r.errorEl.textContent=a,r.input.setAttribute("aria-invalid",a?"true":"false")});let t=Object.keys(e);if(t.length>0){let r=this.fieldElements.get(t[0]);if(r)if(r.input.type==="hidden"){let i=this.container.querySelector(`[data-checkbox-group="${t[0]}"]`);if(i){let a=i.querySelector("input[type=checkbox]");a&&(a.reportValidity(),a.focus())}else{let a=this.findFailingInput(t[0]);a&&(a.reportValidity(),a.focus())}}else r.input.reportValidity(),r.input.focus()}}setStatus(e,t){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${t}`)}async handleSubmit(e){var i,a,p;if(e.preventDefault(),!this.formDefinition||this.options.preview)return;this.setStatus("","info"),this.fieldElements.forEach((l,c)=>{if(l.input.setCustomValidity(""),l.input.type==="hidden"){let o=this.container.querySelector(`[data-checkbox-group="${c}"]`);if(o){let s=o.querySelector("input[type=checkbox]");s&&s.setCustomValidity("")}else this.container.querySelectorAll(`input[data-name-field="${c}"], input[data-address-field="${c}"], select[data-address-field="${c}"]`).forEach(y=>y.setCustomValidity(""))}});let t=this.collectValues(),r=de(this.formDefinition.fields,t);if(this.showErrors(r),Object.keys(r).length>0){let l=Object.keys(r).length;this.setStatus(`Please fix ${l} field${l>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let l=this.options.baseUrl||"",c=this.options.formId||((i=this.formDefinition)==null?void 0:i.formId);if(!c){this.setStatus("Form configuration error.","error");return}let o=await fetch(`${l}/api/embed/${c}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),s=await o.json();if(!o.ok){s!=null&&s.fields&&this.showErrors(s.fields),this.setStatus((s==null?void 0:s.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}e.target.reset(),this.renderSuccess(this.formDefinition.successMessage||"Thanks for your submission!")}catch(l){console.error(l),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let l=((p=(a=this.formDefinition)==null?void 0:a.defaultTheme)==null?void 0:p.buttonText)||"Submit";this.submitButton.textContent=l,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderSuccess(e){this.statusEl&&(this.statusEl.textContent="",this.statusEl.className="canopy-status"),this.formEl&&(this.formEl.style.display="none");let t=this.container.querySelector(".canopy-success");t&&t.remove();let r=document.createElement("div");r.className="canopy-success",r.setAttribute("role","status"),r.setAttribute("aria-live","polite");let i=document.createElement("div");i.className="canopy-success-icon",i.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',r.appendChild(i);let a=document.createElement("p");a.className="canopy-success-message",a.textContent=e,r.appendChild(a);let p=document.createElement("button");p.type="button",p.className="canopy-success-reset",p.textContent="Submit another response",p.addEventListener("click",()=>{this.formDefinition&&this.render(this.formDefinition)}),r.appendChild(p),this.container.appendChild(r)}renderSkeleton(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-skeleton";let t=[{labelW:"30%",type:"input"},{labelW:"45%",type:"input"},{labelW:"25%",type:"textarea"}],r=0,i=document.createElement("div");i.className="canopy-skeleton-bar canopy-skeleton-title",i.style.animationDelay=`${r}s`,e.appendChild(i),r+=.15;let a=document.createElement("div");a.className="canopy-skeleton-bar canopy-skeleton-desc",a.style.animationDelay=`${r}s`,e.appendChild(a),r+=.15;for(let l of t){let c=document.createElement("div");c.className="canopy-skeleton-field";let o=document.createElement("div");o.className="canopy-skeleton-bar canopy-skeleton-label",o.style.width=l.labelW,o.style.animationDelay=`${r}s`,c.appendChild(o),r+=.1;let s=document.createElement("div");s.className=`canopy-skeleton-bar canopy-skeleton-${l.type}`,s.style.animationDelay=`${r}s`,c.appendChild(s),r+=.15,e.appendChild(c)}let p=document.createElement("div");p.className="canopy-skeleton-bar canopy-skeleton-button",p.style.animationDelay=`${r}s`,e.appendChild(p),this.container.appendChild(e)}renderError(e){this.container.innerHTML="";let t=document.createElement("div");t.className="canopy-status canopy-status-error",t.textContent=e,this.container.appendChild(t),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderInactive(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let t=document.createElement("h2");t.className="canopy-inactive-heading",t.textContent="Form Not Available",e.appendChild(t);let r=document.createElement("p");r.className="canopy-inactive-body",r.textContent="This form is not currently accepting responses. Please contact the form owner if you believe this is an error.",e.appendChild(r),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderHostedOnly(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let t=document.createElement("h2");t.className="canopy-inactive-heading",t.textContent="Form Not Available",e.appendChild(t);let r=document.createElement("p");r.className="canopy-inactive-body",r.textContent="This form is only available at its hosted URL and cannot be embedded. Please contact the form owner.",e.appendChild(r),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}};var me=`
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

.canopy-help-text {
  font-size: calc(var(--canopy-font-size, 16px) - 1px);
  color: var(--canopy-text, #18181b);
  margin-top: 4px;
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
`;var ye="canopy-embed-styles";function $e(){if(document.getElementById(ye))return;let n=document.createElement("style");n.id=ye,n.textContent=me,document.head.appendChild(n)}function Me(n){var e;return n.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function Ie(n){let e=n.dataset.theme;if(e)try{return JSON.parse(e)}catch(t){console.warn("Canopy Forms: invalid data-theme JSON");return}}function V(){$e(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let t=e.dataset.canopyForm;if(!t){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let r=Ie(e),i=Me(e);new k(e,{formId:t,themeOverrides:r,baseUrl:i}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",V):V();window.CanopyForms={init:V,CanopyForm:k};})();
