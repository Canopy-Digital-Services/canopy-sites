"use strict";(()=>{var v={fontSize:16,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:4,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:28,titleWeight:"normal",titleAlign:"left",labelSize:18,labelWeight:"normal"},P=new Set;function A(n,e){if(!n)return e;let t=n.trim();return t?/^var\(/i.test(t)||/^rgb/i.test(t)||/^hsl/i.test(t)||/^color\(/i.test(t)||/^(transparent|currentcolor|inherit)$/i.test(t)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(t)?t:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(t)?`#${t}`:e:e}function K(n){if(!n)return{};let{headingFont:e,...t}=n;return e?{titleFont:e,labelFont:e,...t}:t}function J(n,e){return{...v,...K(n),...K(e)}}function ge(n){let e=/^#?([0-9a-f]{6})$/i.exec(n.trim());if(!e)return null;let t=parseInt(e[1],16);return[t>>16&255,t>>8&255,t&255]}function xe(n,e,t){let[r,o,a]=[n,e,t].map(p=>{let s=p/255;return s<=.03928?s/12.92:Math.pow((s+.055)/1.055,2.4)});return .2126*r+.7152*o+.0722*a}function Z(n){let e=ge(n);return e?xe(...e):null}function Ee(n,e){let t=Z(n);if(t===null||t<=.179)return"#ffffff";let r=Z(e);return r!==null&&(t+.05)/(r+.05)>=4.5?e:v.text}function Q(n,e){var d,c,i,l,h,y;let t=Y(e.bodyFont,e.fontFamily);n.style.setProperty("--canopy-font",t);for(let[u,m]of[["--canopy-title-font",e.titleFont],["--canopy-label-font",e.labelFont]]){let f=Y(m);n.style.setProperty(u,f==="inherit"?"var(--canopy-font)":f)}n.style.setProperty("--canopy-font-size",`${(d=e.fontSize)!=null?d:v.fontSize}px`);let r=A(e.text,v.text);n.style.setProperty("--canopy-text",r),n.style.setProperty("--canopy-bg",A(e.background,v.background)),n.style.setProperty("--canopy-field-bg",A(e.fieldBackground,v.fieldBackground));let o=A(e.primary,v.primary);n.style.setProperty("--canopy-primary",o),n.style.setProperty("--canopy-button-text",A(e.buttonTextColor,"")||Ee(o,r)),n.style.setProperty("--canopy-border",A(e.border,v.border)),n.style.setProperty("--canopy-radius",`${(c=e.radius)!=null?c:v.radius}px`),n.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),n.style.setProperty("--canopy-button-align",e.buttonAlign||v.buttonAlign);let a={sm:"1.25em",md:"1.5em",lg:"1.875em",xl:"2.25em"},p=(u,m)=>{var b;let f=Number(u);return f>0?`${f}px`:(b=a[String(u)])!=null?b:`${Number(m)}px`};n.style.setProperty("--canopy-title-size",p(e.titleSize,v.titleSize)),n.style.setProperty("--canopy-label-size",p(e.labelSize,v.labelSize));let s={light:"300",normal:"400",medium:"500",bold:"700",semibold:"700"};n.style.setProperty("--canopy-title-weight",(l=s[(i=e.titleWeight)!=null?i:"normal"])!=null?l:"400"),n.style.setProperty("--canopy-label-weight",(y=s[(h=e.labelWeight)!=null?h:"normal"])!=null?y:"400");for(let[u,m]of[["--canopy-title-color",e.titleColor],["--canopy-label-color",e.labelColor]]){let f=m?A(m,""):"";f?n.style.setProperty(u,f):n.style.removeProperty(u)}n.style.setProperty("--canopy-title-align",e.titleAlign==="center"?"center":"left")}function ee(n){switch(n.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function Y(n,e){return n&&n!=="inherit"?`'${n}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function te(n,e){let t=n.filter(p=>!!p&&p!=="inherit"&&!P.has(p));if(t.length===0)return;let r=t.map(p=>`family=${encodeURIComponent(p)}`).join("&"),o=`${e}/api/fonts?${r}`,a=document.createElement("link");a.rel="stylesheet",a.href=o,a.dataset.canopyFont="true",document.head.appendChild(a),t.forEach(p=>P.add(p))}function ne(n){if(!n||P.has(n))return;let e=document.createElement("link");e.rel="stylesheet",e.href=n,e.dataset.canopyFont="true",document.head.appendChild(e),P.add(n)}var W="Name",ve={first:"First",middle:"Middle",middleInitial:"M.I.",last:"Last",single:W},k=["first","last"],re=["first","middle","middleInitial","last","single"];function ae(n){return[...n].sort((e,t)=>re.indexOf(e)-re.indexOf(t))}function I(n,e){var r;if(n!=null&&n.requiredParts)return n.requiredParts;let t=(r=n==null?void 0:n.parts)!=null?r:k;return e?t.filter(o=>o!=="middle"&&o!=="middleInitial"):[]}function D(n){return n==="middleInitial"?2:100}function F(n,e){return(e==null?void 0:e[n])||ve[n]||n}var Ae={line1:"Street",line2:"Apt, suite",city:"City",region:"State",postalCode:"ZIP"},oe=["line1","line2","city","region","postalCode"];function w(n){var t;let e=(t=n==null?void 0:n.parts)!=null?t:oe;return oe.filter(r=>e.includes(r))}function C(n,e){return(e==null?void 0:e[n])||Ae[n]||n}function B(n,e){return n!=null&&n.requiredParts?n.requiredParts:e?w(n).filter(t=>t!=="line2"):[]}var H=200,Ce=/^\d{5}(-\d{4})?$/;function ie(n,e,t){let r=w(e),o=B(e,t),a=s=>{var d;return String((d=n==null?void 0:n[s])!=null?d:"")},p=s=>a(s).trim();for(let s of r){if(o.includes(s)&&!p(s))return`${C(s,e==null?void 0:e.partLabels)} is required.`;if(a(s).length>H)return`${C(s,e==null?void 0:e.partLabels)} must be at most ${H} characters.`}return r.includes("postalCode")&&p("postalCode")&&!Ce.test(p("postalCode"))?`${C("postalCode",e==null?void 0:e.partLabels)} must be a US ZIP code, like 12345 or 12345-6789.`:null}var U="Choose one...",R="Other",L="__other__";function q(n){let e=Array.isArray(n)?n:n==null?void 0:n.options;return Array.isArray(e)?e.filter(t=>typeof t=="object"&&t!==null&&typeof t.value=="string"):[]}function z(n){return!Array.isArray(n)&&(n==null?void 0:n.allowOther)===!0}function V(n,e,t,r){let o=n==="CHECKBOXES"?e:typeof e=="string"?[e]:null;if(!Array.isArray(o)||o.some(s=>typeof s!="string"))return`${r} must be one of its options.`;if(new Set(o).size<o.length)return`${r} picks an option more than once.`;let a=q(t).map(s=>s.value),p=o.filter(s=>!a.includes(s));return p.length===0?null:!z(t)||p.length>1?`${r} must be one of its options.`:p[0].length>200?`${r} must be 200 characters or fewer.`:null}var de={TEXT:200,EMAIL:254,TEXTAREA:2e3},Te={TEXT:500,EMAIL:320,TEXTAREA:1e4,PHONE:30,NUMBER:50,DATE:30};function X(n){return typeof n.validation=="object"&&n.validation!==null?n.validation:{}}function S(n){let e=de[n.type],t=Te[n.type];if(e===void 0)return t;let r=X(n).maxLength,o=Number.isInteger(r)&&r>0?r:e;return t!==void 0?Math.min(o,t):o}var we=/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;function Le(n){return n.length>320||/[\r\n]/.test(n)?!1:we.test(n)}function ke(n){let e=n.replace(/[^\d+]/g,"");if(e.startsWith("+1"))e=e.substring(2);else{if(e.startsWith("+"))return null;e.startsWith("1")&&e.length===11&&(e=e.substring(1))}return/^\d{10}$/.test(e)?e:null}function _(n=new Date){let e=(t,r=2)=>String(t).padStart(r,"0");return`${e(n.getFullYear(),4)}-${e(n.getMonth()+1)}-${e(n.getDate())}`}function ue(){let n=_();return{earliest:n,latest:n}}function me(n){if(/^\d{4}-\d{2}-\d{2}$/.test(n)){let t=new Date(`${n}T00:00:00Z`);return!isNaN(t.getTime())&&t.toISOString().slice(0,10)===n?n:null}let e=new Date(n);return isNaN(e.getTime())?null:_(e)}function se(n){return new Date(`${n}T00:00:00`).toLocaleDateString()}function le(n,e){return n?n==="today"?e:me(n):null}function j(n,e,t){return e!==void 0&&n.length>e?`${t} must be at most ${e} characters.`:null}function ce(n,e,t){let{minLength:r}=X(n);return r&&e.length<r?`${t} must be at least ${r} characters.`:j(e,S(n),t)}function Se(n,e,t){switch(n){case"numbers":return/^\d+$/.test(e)?null:`${t} must contain only numbers.`;case"letters":return/^[A-Za-z]+$/.test(e)?null:`${t} must contain only letters.`;case"url":{try{if(new URL(e.startsWith("http")?e:`https://${e}`).hostname.includes("."))return null}catch(r){}return`${t} must be a valid URL.`}case"postal-us":return/^\d{5}(-\d{4})?$/.test(e)?null:`${t} must be a valid US postal code (e.g., 12345 or 12345-6789).`;case"postal-ca":return/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(e)?null:`${t} must be a valid Canadian postal code (e.g., K1A 0B1).`;default:return null}}function pe(n,e,t,r){if(n==null)return null;if(typeof n!="object"||Array.isArray(n))return`${r} must be an object of its parts.`;for(let[o,a]of Object.entries(n)){if(!e.includes(o))return`${r} has no part "${o}".`;if(typeof a!="string")return`${t(o)} must be text.`}return null}function Ne(n,e,t=ue()){var p,s,d;let r=n.label||n.name,o=X(n);switch(n.type){case"CHECKBOX":return e!=null&&typeof e!="boolean"&&e!=="on"?`${r} must be true or false.`:n.required&&!e?`${r} is required.`:null;case"CHECKBOXES":if(!Array.isArray(e)||e.length===0){if(n.required)return`${r} is required.`;if(e==null||Array.isArray(e))return null}return V("CHECKBOXES",e,n.options,r);case"NAME":{let c=typeof n.options=="object"&&n.options!==null?n.options:{},i=c.parts||k,l=m=>m==="single"?r:F(m,c.partLabels),h=pe(e,i,l,r);if(h)return h;let y=e,u=I(c,n.required);for(let m of i){let f=y==null?void 0:y[m],b=l(m);if(u.includes(m)&&(!f||String(f).trim()===""))return`${b} is required.`;let g=j(String(f!=null?f:""),D(m),b);if(g)return g}return null}case"ADDRESS":{let c=n.options,i=l=>C(l,c==null?void 0:c.partLabels);return(p=pe(e,w(c),i,r))!=null?p:ie(e,c,n.required)}}if(e==null)return n.required?`${r} is required.`:null;if(typeof e!="string"&&!(n.type==="NUMBER"&&typeof e=="number"))return n.type==="NUMBER"?`${r} must be a number.`:`${r} must be text.`;let a=String(e);if(a.trim()==="")return n.required?`${r} is required.`:null;if(de[n.type]===void 0){let c=j(a,S(n),r);if(c)return c}switch(n.type){case"DROPDOWN":return V("DROPDOWN",e,n.options,r);case"PHONE":{let c=o.format||"lenient";return c==="lenient"&&!/^[\d\s\-\(\)\+\.]{7,}$/.test(a)?`${r} must be a valid phone number.`:c==="strict"&&!ke(a)?`${r} must be a valid US phone number (10 digits).`:null}case"DATE":{let c=me(a);if(!c)return`${r} must be a valid date.`;let i=le(o.minDate,t.earliest);if(i&&c<i)return`${r} must be on or after ${se(i)}.`;let l=le(o.maxDate,t.latest);return l&&c>l?`${r} must be on or before ${se(l)}.`:null}case"NUMBER":{let c=Number(e);return isNaN(c)?`${r} must be a number.`:o.integer&&!Number.isInteger(c)?`${r} must be a whole number.`:o.min!==void 0&&c<o.min?`${r} must be at least ${o.min}.`:o.max!==void 0&&c>o.max?`${r} must be at most ${o.max}.`:null}case"EMAIL":{let c=a.trim();if(!Le(c))return"Enter a valid email address";let i=c.split("@")[1].toLowerCase(),{allow:l,block:h}=(s=o.domainRules)!=null?s:{};return Array.isArray(l)&&l.length>0&&!l.some(y=>String(y).toLowerCase()===i)?`${r} must be from an allowed domain.`:Array.isArray(h)&&h.some(y=>String(y).toLowerCase()===i)?`${r} domain is not allowed.`:ce(n,c,r)}default:return(d=ce(n,a,r))!=null?d:Se(o.format,a,r)}}function fe(n,e,t=ue()){let r={};for(let o of n){let a=Ne(o,$e(e,o.name),t);a&&(r[o.name]=a)}return r}function $e(n,e){return Object.prototype.hasOwnProperty.call(n,e)?n[e]:void 0}var ye=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var Oe={single:"name",first:"given-name",middle:"additional-name",last:"family-name"},Pe={line1:"address-line1",line2:"address-line2",city:"address-level2",region:"address-level1",postalCode:"postal-code"},N=(n,e,t)=>n.setAttribute("aria-describedby",e?`${e.id} ${t.id}`:t.id),Ie="feedback@canopyds.com",De=0,$=class extends Error{constructor(e){super(e),this.name="InactiveFormError"}},M=class extends Error{constructor(e){super(e),this.name="HostedOnlyFormError"}},O=class{constructor(e,t){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.formEl=null;this.submitButton=null;this.instanceId=`canopy-${De++}`;this.container=e,this.options=t}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){if(console.error(e),e instanceof $){this.renderInactive();return}if(e instanceof M){this.renderHostedOnly();return}this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var o;let e=this.options.baseUrl||"",t=this.options.formId||((o=this.formDefinition)==null?void 0:o.formId);if(!t)throw new Error("Form configuration error: no formId");let r=await fetch(`${e}/api/embed/${t}`,{method:"GET",credentials:"omit"});if(!r.ok){if(r.status===403)try{let a=await r.json();if((a==null?void 0:a.code)==="FORM_INACTIVE")throw new $(a.error||"Form is inactive");if((a==null?void 0:a.code)==="FORM_HOSTED_ONLY")throw new M(a.error||"Form is only available at its hosted URL")}catch(a){if(a instanceof $||a instanceof M)throw a}throw new Error("Failed to load form definition")}return r.json()}renderFromDefinition(e){this.container.classList.add("canopy-root"),this.formDefinition=e,this.render(e)}render(e){this.container.innerHTML="",this.fieldElements.clear();let t=J(e.defaultTheme,this.options.themeOverrides);Q(this.container,t),te([t.bodyFont,t.titleFont,t.labelFont],this.options.baseUrl||""),!t.bodyFont&&!t.titleFont&&!t.labelFont&&ne(t.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(ee(t));let r=e.fields&&e.fields.length>0,o=e.title||e.description;if(!r&&!o){this.renderSkeleton();return}if(e.title||e.description){let u=document.createElement("div");if(u.className="canopy-header",e.title){let m=document.createElement("h2");m.className="canopy-title",m.textContent=e.title,u.appendChild(m)}if(e.description){let m=document.createElement("p");m.className="canopy-description",m.textContent=e.description,u.appendChild(m)}this.container.appendChild(u)}let a=document.createElement("div");a.className="canopy-status",a.setAttribute("role","alert"),a.setAttribute("aria-live","assertive"),this.statusEl=a;let p=document.createElement("form");p.className="canopy-form",p.addEventListener("submit",u=>this.handleSubmit(u)),this.formEl=p,e.fields.forEach(u=>{let{wrapper:m,input:f,errorEl:b}=this.createField(u);m&&(m.dataset.fieldName=u.name,p.appendChild(m)),this.fieldElements.set(u.name,{input:f,errorEl:b})}),this.options.preview&&(p.setAttribute("autocomplete","off"),p.querySelectorAll("input, select, textarea").forEach(u=>u.setAttribute("autocomplete","off")));let s=document.createElement("button");s.type="submit",s.className="canopy-submit",s.textContent=t.buttonText||"Submit",this.options.preview&&(s.classList.add("canopy-submit-preview"),s.setAttribute("data-preview-tooltip","For preview only. No submission will be created"));let d=getComputedStyle(this.container),c=d.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",i=d.getPropertyValue("--canopy-button-text").trim()||"#ffffff",l=d.getPropertyValue("--canopy-radius").trim()||"8px",h=d.getPropertyValue("--canopy-button-width").trim()||"100%";s.style.cssText=`
      display: block !important;
      width: ${h} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${l} !important;
      padding: 10px 16px !important;
      font-family: var(--canopy-font, inherit) !important;
      font-size: var(--canopy-font-size, 16px) !important;
      font-weight: 600 !important;
      background: ${c} !important;
      background-color: ${c} !important;
      color: ${i} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=s;let y=document.createElement("div");y.className="canopy-form-actions",y.appendChild(s),p.appendChild(y),this.container.appendChild(a),this.container.appendChild(p),this.container.appendChild(this.renderWatermark(e))}renderWatermark(e){let t=document.createElement("div");t.className="canopy-watermark";let r=document.createElement("span");r.className="canopy-watermark-brand",r.textContent="Powered by Canopy Forms (Beta)",t.appendChild(r);let o=document.createElement("span");o.className="canopy-watermark-sep",o.setAttribute("aria-hidden","true"),o.textContent="\xB7",t.appendChild(o);let a=(e==null?void 0:e.title)||(e==null?void 0:e.name)||(e==null?void 0:e.formId)||"unknown form",p=(e==null?void 0:e.formId)||"unknown",s=`Canopy Forms issue \u2014 ${a}`,d=[`Form: ${a}`,`Form ID: ${p}`,"","Describe the issue:",""].join(`
`),c=`mailto:${Ie}?subject=${encodeURIComponent(s)}&body=${encodeURIComponent(d)}`,i=document.createElement("a");return i.className="canopy-watermark-link",i.href=c,i.textContent="Report an issue",i.rel="noopener",t.appendChild(i),t}createField(e){var c;let t=`${this.instanceId}-${e.name}`,r=document.createElement("div");r.className="canopy-field";let o=document.createElement("label");if(o.className="canopy-label",o.dataset.fieldPart="label",o.htmlFor=t,o.textContent=e.label||e.name,e.required){let i=document.createElement("span");i.className="canopy-required",i.textContent=" *",i.setAttribute("aria-hidden","true"),o.appendChild(i)}let a;switch(e.type){case"TEXTAREA":{let i=document.createElement("textarea");i.className="canopy-textarea";let l=S(e);if(l){let h=Math.min(Math.max(Math.ceil(l/60),4),15);i.rows=h}else i.rows=4;a=i;break}case"DROPDOWN":{let i=q(e.options),l=Array.isArray(e.options)||(c=e.options)==null?void 0:c.defaultValue,h=i.some(f=>f.value===l),y=z(e.options),u=document.createElement("select");u.className="canopy-select";let m=document.createElement("option");if(m.value="",m.textContent=U,m.disabled=!0,m.selected=!h,u.appendChild(m),i.forEach(f=>{let b=document.createElement("option");b.value=f.value,b.textContent=f.label,h&&f.value===l&&(b.selected=!0),u.appendChild(b)}),y){let f=document.createElement("option");f.value=L,f.textContent=R,u.appendChild(f)}if(a=u,y){let f=this.createOtherInput(e);u.addEventListener("change",()=>{u.value===L?(f.style.setProperty("display","block","important"),e.required&&(f.required=!0)):(f.style.setProperty("display","none","important"),f.required=!1,f.value="")}),u.__otherInput=f}break}case"CHECKBOX":{let i=document.createElement("label");i.className="canopy-checkbox";let l=document.createElement("input");l.type="checkbox",l.id=t,l.name=e.name,e.required&&l.setAttribute("aria-required","true"),l.addEventListener("change",()=>{l.setCustomValidity("")}),i.appendChild(l);let h=document.createElement("span");h.dataset.fieldPart="label",h.textContent=e.label||e.name,i.appendChild(h),r.appendChild(i);let y=this.createHelpText(e,t);y&&r.appendChild(y);let u=document.createElement("span");return u.className="canopy-error",u.id=`${t}-error`,r.appendChild(u),N(l,y,u),l.setAttribute("aria-invalid","false"),{wrapper:r,input:l,errorEl:u}}case"CHECKBOXES":{let i=document.createElement("div");i.className="canopy-checkboxes",i.setAttribute("data-checkbox-group",e.name);let l=()=>{let f=i.querySelector("input[type=checkbox]");f&&f.setCustomValidity("")},h=(f,b,g)=>{let E=document.createElement("label");E.className="canopy-checkbox",E.dataset.fieldPart=g;let x=document.createElement("input");x.type="checkbox",x.name=e.name,x.value=f,x.addEventListener("change",l);let T=document.createElement("span");return T.textContent=b,E.appendChild(x),E.appendChild(T),i.appendChild(E),x};if(q(e.options).forEach((f,b)=>{h(f.value,f.label,`option-${b}`)}),z(e.options)){let f=h(L,R,"option-other"),b=this.createOtherInput(e);b.dataset.choiceOther=e.name,b.addEventListener("input",l),f.addEventListener("change",()=>{f.checked?(b.style.setProperty("display","block","important"),b.focus()):(b.style.setProperty("display","none","important"),b.value="")}),i.appendChild(b)}let y=document.createElement("input");y.type="hidden",y.id=t,y.name=e.name,o.id=`${t}-label`,i.setAttribute("role","group"),i.setAttribute("aria-labelledby",o.id);let u=this.createHelpText(e,t);r.appendChild(o),u&&r.appendChild(u),r.appendChild(i);let m=document.createElement("span");return m.className="canopy-error",m.id=`${t}-error`,r.appendChild(m),N(i,u,m),y.setAttribute("aria-invalid","false"),{wrapper:r,input:y,errorEl:m}}case"EMAIL":{let i=document.createElement("input");i.type="email",i.setAttribute("autocomplete","email"),i.className="canopy-input",a=i;break}case"PHONE":{let i=document.createElement("input");i.type="tel",i.setAttribute("inputmode","tel"),i.setAttribute("autocomplete","tel"),i.className="canopy-input",a=i;break}case"DATE":{let i=document.createElement("input");i.type="date",i.className="canopy-input";let l=e.validation;l&&(l.minDate&&(i.min=this.resolveDate(l.minDate)),l.maxDate&&(i.max=this.resolveDate(l.maxDate))),a=i;break}case"NUMBER":{let i=document.createElement("input");i.type="number",i.className="canopy-input";let l=e.validation;i.setAttribute("step",l!=null&&l.integer?"1":"any"),(l==null?void 0:l.min)!==void 0&&l.min<0||i.setAttribute("inputmode",l!=null&&l.integer?"numeric":"decimal"),(l==null?void 0:l.min)!==void 0&&i.setAttribute("min",String(l.min)),(l==null?void 0:l.max)!==void 0&&i.setAttribute("max",String(l.max)),a=i;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);default:{let i=document.createElement("input");i.type="text",i.className="canopy-input",a=i}}a.id=t,a.name=e.name,a.dataset.fieldPart="input",a.setAttribute("aria-invalid","false"),e.required&&a.setAttribute("aria-required","true");let p=S(e);p&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=p),a.addEventListener("input",()=>{a.setCustomValidity("")});let s=document.createElement("span");s.className="canopy-error",s.id=`${t}-error`;let d=this.createHelpText(e,t);return r.appendChild(o),d&&r.appendChild(d),r.appendChild(a),N(a,d,s),a.__otherInput&&r.appendChild(a.__otherInput),r.appendChild(s),{wrapper:r,input:a,errorEl:s}}createHelpText(e,t){if(!e.helpText)return null;let r=document.createElement("p");return r.className="canopy-help-text",r.id=`${t}-help`,r.textContent=e.helpText,r}createOtherInput(e){let t=document.createElement("input");return t.type="text",t.className="canopy-input canopy-choice-other",t.name=`${e.name}_other`,t.placeholder="Please specify...",t.maxLength=200,t.setAttribute("aria-label",`${e.label||e.name}: ${R}`),t.style.setProperty("display","none","important"),t.addEventListener("input",()=>{t.setCustomValidity("")}),t}resolveDate(e){return e==="today"?_():e}createNameField(e){let t=`${this.instanceId}-${e.name}`,r=document.createElement("div");r.className="canopy-field canopy-name-group",r.setAttribute("role","group");let o=e.options||{},a=ae(o.parts||k),p=I(o,e.required),s=e.label||W,d=a.includes("single"),c=this.createHelpText(e,t);if(d)r.setAttribute("aria-label",s);else{let y=document.createElement("span");y.id=`${t}-group-label`,y.className="canopy-label",y.dataset.fieldPart="label",y.textContent=s,r.appendChild(y),c&&r.appendChild(c),r.setAttribute("aria-labelledby",y.id)}let i=document.createElement("div");i.className="canopy-name-parts";let l=document.createElement("input");l.type="hidden",l.id=t,l.name=e.name;let h=document.createElement("span");return h.className="canopy-error",h.id=`${t}-error`,a.forEach(y=>{let u=document.createElement("div");u.className=y==="middleInitial"?"canopy-name-part canopy-name-part-initial":"canopy-name-part";let m=document.createElement("label");m.className=d?"canopy-label":"canopy-name-part-label";let f=`${t}-${y}`;m.htmlFor=f,m.textContent=d?s:F(y,o.partLabels),m.dataset.fieldPart=d?"label":`label-${y}`;let b=p.includes(y);if(b){let x=document.createElement("span");x.className="canopy-required",x.textContent=" *",x.setAttribute("aria-hidden","true"),m.appendChild(x)}let g=document.createElement("input");g.type="text",g.className="canopy-input",g.id=f,g.name=`${e.name}.${y}`,g.setAttribute("data-name-part",y),g.setAttribute("data-name-field",e.name),g.maxLength=D(y);let E=Oe[y];E&&g.setAttribute("autocomplete",E),b&&g.setAttribute("aria-required","true"),g.addEventListener("input",()=>{i.querySelectorAll("input[data-name-part]").forEach(x=>x.setCustomValidity(""))}),u.appendChild(m),d&&c&&u.appendChild(c),u.appendChild(g),i.appendChild(u)}),r.appendChild(i),N(r,c,h),r.appendChild(h),{wrapper:r,input:l,errorEl:h}}createAddressField(e){let t=`${this.instanceId}-${e.name}`,r=e.options||{},o=document.createElement("div");o.className="canopy-field canopy-address-group",o.setAttribute("role","group"),o.setAttribute("aria-labelledby",`${t}-group-label`);let a=document.createElement("span");a.id=`${t}-group-label`,a.className="canopy-label",a.dataset.fieldPart="label",a.textContent=e.label||"Address",o.appendChild(a);let p=this.createHelpText(e,t);p&&o.appendChild(p);let s=document.createElement("div");s.className="canopy-address-parts";let d=document.createElement("input");d.type="hidden",d.id=t,d.name=e.name;let c=document.createElement("span");c.className="canopy-error",c.id=`${t}-error`;let i={postalCode:{maxlength:"10",inputmode:"numeric"}},l=B(r,e.required);return w(r).forEach(h=>{let y=l.includes(h),u=document.createElement("div");u.className=`canopy-address-part canopy-address-part-${h}`;let m=document.createElement("label");m.className="canopy-address-part-label";let f=`${t}-${h}`;if(m.htmlFor=f,m.textContent=C(h,r.partLabels),m.dataset.fieldPart=`label-${h}`,y){let g=document.createElement("span");g.className="canopy-required",g.textContent=" *",g.setAttribute("aria-hidden","true"),m.appendChild(g)}let b;if(h==="region"){let g=document.createElement("select");g.className="canopy-select";let E=document.createElement("option");E.value="",E.textContent=U,g.appendChild(E),ye.forEach(x=>{let T=document.createElement("option");T.value=x.value,T.textContent=x.label,g.appendChild(T)}),g.addEventListener("change",()=>{s.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(x=>x.setCustomValidity(""))}),b=g}else{let g=document.createElement("input");g.type="text",g.className="canopy-input",g.maxLength=H,i[h]&&Object.entries(i[h]).forEach(([E,x])=>g.setAttribute(E,x)),g.addEventListener("input",()=>{s.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(E=>E.setCustomValidity(""))}),b=g}b.id=f,b.setAttribute("autocomplete",Pe[h]),b.setAttribute("data-address-part",h),b.setAttribute("data-address-field",e.name),y&&b.setAttribute("aria-required","true"),u.appendChild(m),u.appendChild(b),s.appendChild(u)}),o.appendChild(s),N(o,p,c),o.appendChild(c),{wrapper:o,input:d,errorEl:c}}collectValues(){let e={};return this.fieldElements.forEach((t,r)=>{if(t.input instanceof HTMLInputElement)if(t.input.type==="checkbox")e[r]=t.input.checked;else if(t.input.type==="hidden"){let o=this.container.querySelector(`[data-checkbox-group="${r}"]`);if(o){let a=[];o.querySelectorAll("input[type=checkbox]:checked").forEach(p=>{var d;if(p.value!==L){a.push(p.value);return}let s=(d=o.querySelector("[data-choice-other]"))==null?void 0:d.value.trim();s&&a.push(s)}),e[r]=a}else{let a=this.container.querySelectorAll(`input[data-name-field="${r}"]`);if(a.length>0){let p={};a.forEach(s=>{let d=s,c=d.getAttribute("data-name-part");c&&(p[c]=d.value)}),e[r]=p}else{let p=this.container.querySelectorAll(`input[data-address-field="${r}"], select[data-address-field="${r}"]`);if(p.length>0){let s={};p.forEach(d=>{let c=d.getAttribute("data-address-part");c&&(s[c]=d.value)}),e[r]=s}else e[r]=t.input.value}}}else e[r]=t.input.value;else t.input instanceof HTMLSelectElement&&t.input.value===L&&t.input.__otherInput?e[r]=t.input.__otherInput.value:e[r]=t.input.value}),e}findFailingInput(e){let t=this.container.querySelectorAll(`input[data-name-field="${e}"]`),r=a=>a.getAttribute("aria-required")==="true"&&!a.value.trim()||a instanceof HTMLInputElement&&a.maxLength>0&&a.value.length>a.maxLength;if(t.length>0){for(let a of t)if(r(a))return a;return t[0]}let o=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(o.length>0){for(let a of o)if(r(a))return a;for(let a of o)if(a.getAttribute("data-address-part")==="postalCode")return a;return o[0]}return null}showErrors(e){this.fieldElements.forEach((r,o)=>{let a=e[o]||"";if(r.input.type==="hidden"){let p=this.container.querySelector(`[data-checkbox-group="${o}"]`);if(p){let s=p.querySelector("input[type=checkbox]");s&&s.setCustomValidity(a)}else{let s=a?this.findFailingInput(o):null;s?s.setCustomValidity(a):this.container.querySelectorAll(`input[data-name-field="${o}"], input[data-address-field="${o}"], select[data-address-field="${o}"]`).forEach(c=>c.setCustomValidity(""))}}else r.input.setCustomValidity(a);r.errorEl.textContent=a,r.input.setAttribute("aria-invalid",a?"true":"false")});let t=Object.keys(e);if(t.length>0){let r=this.fieldElements.get(t[0]);if(r)if(r.input.type==="hidden"){let o=this.container.querySelector(`[data-checkbox-group="${t[0]}"]`);if(o){let a=o.querySelector("input[type=checkbox]");a&&(a.reportValidity(),a.focus())}else{let a=this.findFailingInput(t[0]);a&&(a.reportValidity(),a.focus())}}else r.input.reportValidity(),r.input.focus()}}setStatus(e,t){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${t}`)}async handleSubmit(e){var o,a,p;if(e.preventDefault(),!this.formDefinition||this.options.preview)return;this.setStatus("","info"),this.fieldElements.forEach((s,d)=>{if(s.input.setCustomValidity(""),s.input.type==="hidden"){let c=this.container.querySelector(`[data-checkbox-group="${d}"]`);if(c){let i=c.querySelector("input[type=checkbox]");i&&i.setCustomValidity("")}else this.container.querySelectorAll(`input[data-name-field="${d}"], input[data-address-field="${d}"], select[data-address-field="${d}"]`).forEach(l=>l.setCustomValidity(""))}});let t=this.collectValues(),r=fe(this.formDefinition.fields,t);if(this.showErrors(r),Object.keys(r).length>0){let s=Object.keys(r).length;this.setStatus(`Please fix ${s} field${s>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let s=this.options.baseUrl||"",d=this.options.formId||((o=this.formDefinition)==null?void 0:o.formId);if(!d){this.setStatus("Form configuration error.","error");return}let c=await fetch(`${s}/api/embed/${d}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),i=await c.json();if(!c.ok){i!=null&&i.fields&&this.showErrors(i.fields),this.setStatus((i==null?void 0:i.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}e.target.reset(),this.renderSuccess(this.formDefinition.successMessage||"Thanks for your submission!")}catch(s){console.error(s),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let s=((p=(a=this.formDefinition)==null?void 0:a.defaultTheme)==null?void 0:p.buttonText)||"Submit";this.submitButton.textContent=s,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderSuccess(e){this.statusEl&&(this.statusEl.textContent="",this.statusEl.className="canopy-status"),this.formEl&&(this.formEl.style.display="none");let t=this.container.querySelector(".canopy-success");t&&t.remove();let r=document.createElement("div");r.className="canopy-success",r.setAttribute("role","status"),r.setAttribute("aria-live","polite");let o=document.createElement("div");o.className="canopy-success-icon",o.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',r.appendChild(o);let a=document.createElement("p");a.className="canopy-success-message",a.textContent=e,r.appendChild(a);let p=document.createElement("button");p.type="button",p.className="canopy-success-reset",p.textContent="Submit another response",p.addEventListener("click",()=>{this.formDefinition&&this.render(this.formDefinition)}),r.appendChild(p),this.container.appendChild(r)}renderSkeleton(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-skeleton";let t=[{labelW:"30%",type:"input"},{labelW:"45%",type:"input"},{labelW:"25%",type:"textarea"}],r=0,o=document.createElement("div");o.className="canopy-skeleton-bar canopy-skeleton-title",o.style.animationDelay=`${r}s`,e.appendChild(o),r+=.15;let a=document.createElement("div");a.className="canopy-skeleton-bar canopy-skeleton-desc",a.style.animationDelay=`${r}s`,e.appendChild(a),r+=.15;for(let s of t){let d=document.createElement("div");d.className="canopy-skeleton-field";let c=document.createElement("div");c.className="canopy-skeleton-bar canopy-skeleton-label",c.style.width=s.labelW,c.style.animationDelay=`${r}s`,d.appendChild(c),r+=.1;let i=document.createElement("div");i.className=`canopy-skeleton-bar canopy-skeleton-${s.type}`,i.style.animationDelay=`${r}s`,d.appendChild(i),r+=.15,e.appendChild(d)}let p=document.createElement("div");p.className="canopy-skeleton-bar canopy-skeleton-button",p.style.animationDelay=`${r}s`,e.appendChild(p),this.container.appendChild(e)}renderError(e){this.container.innerHTML="";let t=document.createElement("div");t.className="canopy-status canopy-status-error",t.textContent=e,this.container.appendChild(t),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderInactive(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let t=document.createElement("h2");t.className="canopy-inactive-heading",t.textContent="Form Not Available",e.appendChild(t);let r=document.createElement("p");r.className="canopy-inactive-body",r.textContent="This form is not currently accepting responses. Please contact the form owner if you believe this is an error.",e.appendChild(r),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}renderHostedOnly(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let t=document.createElement("h2");t.className="canopy-inactive-heading",t.textContent="Form Not Available",e.appendChild(t);let r=document.createElement("p");r.className="canopy-inactive-body",r.textContent="This form is only available at its hosted URL and cannot be embedded. Please contact the form owner.",e.appendChild(r),this.container.appendChild(e),this.container.appendChild(this.renderWatermark(this.formDefinition))}};var he=`
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
`;var be="canopy-embed-styles";function Fe(){if(document.getElementById(be))return;let n=document.createElement("style");n.id=be,n.textContent=he,document.head.appendChild(n)}function He(n){var e;return n.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function Re(n){let e=n.dataset.theme;if(e)try{return JSON.parse(e)}catch(t){console.warn("Canopy Forms: invalid data-theme JSON");return}}function G(){Fe(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let t=e.dataset.canopyForm;if(!t){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let r=Re(e),o=He(e);new O(e,{formId:t,themeOverrides:r,baseUrl:o}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",G):G();window.CanopyForms={init:G,CanopyForm:O};})();
