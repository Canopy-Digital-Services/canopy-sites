"use strict";(()=>{var E={fontSize:14,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:8,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:"md",titleWeight:"semibold",titleColor:void 0,labelWeight:"medium",labelTransform:"none",bodyFont:void 0,headingFont:void 0,fontUrl:void 0,fontFamily:void 0,buttonText:void 0},S=new Set;function C(i,e){if(!i)return e;let n=i.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:e:e}function F(i,e){return{...E,...i!=null?i:{},...e!=null?e:{}}}function P(i){let e=/^#?([0-9a-f]{6})$/i.exec(i.trim());if(!e)return null;let n=parseInt(e[1],16);return[n>>16&255,n>>8&255,n&255]}function z(i,e,n){let[t,r,a]=[i,e,n].map(u=>{let m=u/255;return m<=.03928?m/12.92:Math.pow((m+.055)/1.055,2.4)});return .2126*t+.7152*r+.0722*a}function V(i){try{let e=P(i);return e&&z(...e)>.179?"#18181b":"#ffffff"}catch(e){return"#ffffff"}}function $(i,e){var l,f,g,b,y;let n=N(e.bodyFont,e.fontFamily);i.style.setProperty("--canopy-font",n);let t=N(e.headingFont);i.style.setProperty("--canopy-heading-font",t==="inherit"?"var(--canopy-font)":t),i.style.setProperty("--canopy-font-size",`${(l=e.fontSize)!=null?l:E.fontSize}px`),i.style.setProperty("--canopy-text",C(e.text,E.text)),i.style.setProperty("--canopy-bg",C(e.background,E.background)),i.style.setProperty("--canopy-field-bg",C(e.fieldBackground,E.fieldBackground));let r=C(e.primary,E.primary);i.style.setProperty("--canopy-primary",r),i.style.setProperty("--canopy-button-text",V(r)),i.style.setProperty("--canopy-border",C(e.border,E.border)),i.style.setProperty("--canopy-radius",`${(f=e.radius)!=null?f:E.radius}px`),i.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),i.style.setProperty("--canopy-button-align",e.buttonAlign||E.buttonAlign);let a={sm:"1em",md:"1.25em",lg:"1.5em",xl:"1.875em"};i.style.setProperty("--canopy-title-size",a[(g=e.titleSize)!=null?g:"md"]);let u={normal:"400",semibold:"600",bold:"700"};i.style.setProperty("--canopy-title-weight",u[(b=e.titleWeight)!=null?b:"semibold"]);let m=e.titleColor?C(e.titleColor,""):"";m?i.style.setProperty("--canopy-title-color",m):i.style.removeProperty("--canopy-title-color");let o={normal:"400",medium:"500",semibold:"600"};i.style.setProperty("--canopy-label-weight",o[(y=e.labelWeight)!=null?y:"medium"]),i.style.setProperty("--canopy-label-transform",e.labelTransform==="uppercase"?"uppercase":"none")}function M(i){switch(i.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function N(i,e){return i&&i!=="inherit"?`'${i}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function O(i){let e=i.filter(a=>!!a&&a!=="inherit"&&!S.has(a));if(e.length===0)return;let t=`https://fonts.googleapis.com/css2?${e.map(a=>`family=${encodeURIComponent(a)}:wght@400;500;600;700`).join("&")}&display=swap`,r=document.createElement("link");r.rel="stylesheet",r.href=t,r.dataset.canopyFont="true",document.head.appendChild(r),e.forEach(a=>S.add(a))}function D(i){if(!i||S.has(i))return;let e=document.createElement("link");e.rel="stylesheet",e.href=i,e.dataset.canopyFont="true",document.head.appendChild(e),S.add(i)}var W={TEXT:200,EMAIL:254,TEXTAREA:2e3};function L(i){var e;return(e=i.validation)!=null&&e.maxLength?i.validation.maxLength:W[i.type]}function U(i){return i.label||i.name}function I(i,e){let n={};return i.forEach(t=>{var o,l,f,g,b,y,d;let r=e[t.name],a=U(t);if(t.required){if(t.type==="CHECKBOX"){if(!r){n[t.name]=`${a} is required.`;return}}else if(t.type==="CHECKBOXES"){if(!Array.isArray(r)||r.length===0){n[t.name]=`${a} is required.`;return}}else if(t.type!=="NAME"){if(t.type!=="ADDRESS"){if(r==null||String(r).trim()===""){n[t.name]=`${a} is required.`;return}}}}if(t.type==="CHECKBOXES"){if(Array.isArray(r)&&r.length>0){let s=t.options,p=s&&typeof s=="object"&&"options"in s?s.options.map(h=>h.value):[];for(let h of r)if(!p.includes(String(h))){n[t.name]=`${a} contains an invalid option.`;return}}return}if(!(t.type==="NAME"||t.type==="ADDRESS")){if(r==null||String(r).trim()==="")return}if(t.type==="EMAIL"){let s=String(r);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(s)){n[t.name]="Enter a valid email address";return}let p=(o=t.validation)==null?void 0:o.domainRules;if(p){let h=(l=s.split("@")[1])==null?void 0:l.toLowerCase();if(p.allow&&p.allow.length>0&&!p.allow.map(v=>v.toLowerCase()).includes(h)){n[t.name]=`${a} must be from an allowed domain.`;return}if(p.block&&p.block.length>0&&p.block.map(v=>v.toLowerCase()).includes(h)){n[t.name]=`${a} domain is not allowed.`;return}}}if(t.type==="PHONE"){let s=String(r),c=((f=t.validation)==null?void 0:f.format)||"lenient";if(c==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(s)){n[t.name]=`${a} must be a valid phone number.`;return}}else if(c==="strict"){let p=s.replace(/[^\d+]/g,"");if(p.startsWith("+1"))p=p.substring(2);else if(p.startsWith("+")){n[t.name]=`${a} must be a valid US phone number (10 digits).`;return}else p.startsWith("1")&&p.length===11&&(p=p.substring(1));if(!/^\d{10}$/.test(p)){n[t.name]=`${a} must be a valid US phone number (10 digits).`;return}}return}if(t.type==="DATE"){let s=String(r),c=new Date(s);if(isNaN(c.getTime())){n[t.name]=`${a} must be a valid date.`;return}let p=new Date;p.setHours(0,0,0,0),c.setHours(0,0,0,0);let h=t.validation;if(h!=null&&h.noFuture&&c>p){n[t.name]=`${a} cannot be a future date.`;return}if(h!=null&&h.noPast&&c<p){n[t.name]=`${a} cannot be a past date.`;return}if(h!=null&&h.minDate){let x=new Date(h.minDate==="today"?p:h.minDate);if(x.setHours(0,0,0,0),c<x){n[t.name]=`${a} must be on or after ${x.toLocaleDateString()}.`;return}}if(h!=null&&h.maxDate){let x=new Date(h.maxDate==="today"?p:h.maxDate);if(x.setHours(0,0,0,0),c>x){n[t.name]=`${a} must be on or before ${x.toLocaleDateString()}.`;return}}}if(t.type==="NUMBER"){let s=Number(r);if(isNaN(s)){n[t.name]=`${a} must be a number.`;return}let c=t.validation;if(c!=null&&c.integer&&!Number.isInteger(s)){n[t.name]=`${a} must be a whole number.`;return}if((c==null?void 0:c.min)!==void 0&&s<c.min){n[t.name]=`${a} must be at least ${c.min}.`;return}if((c==null?void 0:c.max)!==void 0&&s>c.max){n[t.name]=`${a} must be at most ${c.max}.`;return}return}if(t.type==="NAME"){let s=r,c=t.options||{parts:["first","last"]},p=c.parts||["first","last"],h=c.partsRequired||{};for(let x of p){let v=s[x];if((t.required||h[x])&&(!v||v.trim()==="")){let A=((g=c.partLabels)==null?void 0:g[x])||x;n[t.name]=`${A} is required.`;return}}return}if(t.type==="ADDRESS"){let s=r,c=t.options||{},p=["line1","city","region","postalCode"];if(!(c.showLine2!==!1?["line1","line2","city","region","postalCode"]:p).some(T=>{var A;return(A=s==null?void 0:s[T])==null?void 0:A.trim()})&&!t.required)return;let v={line1:"Street address",city:"City",region:"State",postalCode:"ZIP code"};for(let T of p)if(!((b=s==null?void 0:s[T])!=null&&b.trim())){n[t.name]=`${v[T]} is required.`;return}return}if(t.type==="DROPDOWN"&&Array.isArray(t.options)&&!t.options.map(c=>c.value).includes(String(r))){n[t.name]=`${a} must be a valid option.`;return}let u=String(r),m=L(t);if((y=t.validation)!=null&&y.minLength&&u.length<t.validation.minLength){n[t.name]=`${a} must be at least ${t.validation.minLength} characters.`;return}if(m&&u.length>m){n[t.name]=`${a} must be at most ${m} characters.`;return}if(t.type==="TEXT"||t.type==="TEXTAREA"){let s=(d=t.validation)==null?void 0:d.format;if(s&&s!=="alphanumeric"){let c=!0,p=`${a} is invalid.`;switch(s){case"numbers":c=/^\d+$/.test(u),p=`${a} must contain only numbers.`;break;case"letters":c=/^[A-Za-z]+$/.test(u),p=`${a} must contain only letters.`;break;case"url":{let h=u.startsWith("http")?u:`https://${u}`;try{c=new URL(h).hostname.includes(".")}catch(x){c=!1}p=`${a} must be a valid URL.`;break}case"postal-us":c=/^\d{5}(-\d{4})?$/.test(u),p=`${a} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":c=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(u),p=`${a} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}c||(n[t.name]=p)}}}),n}var H=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var _=0,k=class{constructor(e,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.submitButton=null;this.instanceId=`canopy-${_++}`;this.container=e,this.options=n}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){console.error(e),this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){let e=this.options.baseUrl||"",n=await fetch(`${e}/api/embed/${this.options.formId}`,{method:"GET",credentials:"omit"});if(!n.ok)throw new Error("Failed to load form definition");return n.json()}render(e){this.container.innerHTML="",this.fieldElements.clear();let n=F(e.defaultTheme,this.options.themeOverrides);if($(this.container,n),O([n.bodyFont,n.headingFont]),!n.bodyFont&&!n.headingFont&&D(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(M(n)),!e.fields||e.fields.length===0){this.renderError("This form is not configured yet.");return}if(e.title||e.description){let b=document.createElement("div");if(b.className="canopy-header",e.title){let y=document.createElement("h2");y.className="canopy-title",y.textContent=e.title,b.appendChild(y)}if(e.description){let y=document.createElement("p");y.className="canopy-description",y.textContent=e.description,b.appendChild(y)}this.container.appendChild(b)}let t=document.createElement("div");t.className="canopy-status",t.setAttribute("role","status"),this.statusEl=t;let r=document.createElement("form");r.className="canopy-form",r.addEventListener("submit",b=>this.handleSubmit(b)),e.fields.forEach(b=>{let{wrapper:y,input:d,errorEl:s}=this.createField(b);y&&r.appendChild(y),this.fieldElements.set(b.name,{input:d,errorEl:s})});let a=document.createElement("button");a.type="submit",a.className="canopy-submit",a.textContent=n.buttonText||"Submit";let u=getComputedStyle(this.container),m=u.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",o=u.getPropertyValue("--canopy-button-text").trim()||"#ffffff",l=u.getPropertyValue("--canopy-radius").trim()||"8px",f=u.getPropertyValue("--canopy-button-width").trim()||"100%";a.style.cssText=`
      display: block !important;
      width: ${f} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${l} !important;
      padding: 10px 16px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: ${m} !important;
      background-color: ${m} !important;
      color: ${o} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=a;let g=document.createElement("div");g.className="canopy-form-actions",g.appendChild(a),r.appendChild(g),this.container.appendChild(t),this.container.appendChild(r)}createField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field";let r=document.createElement("label");if(r.className="canopy-label",r.htmlFor=n,r.textContent=e.label||e.name,e.required){let o=document.createElement("span");o.className="canopy-required",o.textContent=" *",r.appendChild(o)}let a;switch(e.type){case"TEXTAREA":{let o=document.createElement("textarea");o.className="canopy-textarea";let l=L(e);if(l){let f=Math.min(Math.max(Math.ceil(l/60),4),15);o.rows=f}else o.rows=4;a=o;break}case"DROPDOWN":{let o=e.options,l=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o),f=l?o.options:Array.isArray(o)?o:[],g=l?o.defaultValue:void 0,b=l?o.allowOther:!1,y=document.createElement("select");if(y.className="canopy-select",f.forEach(d=>{let s=document.createElement("option");s.value=d.value,s.textContent=d.label,g&&d.value===g&&(s.selected=!0),y.appendChild(s)}),b){let d=document.createElement("option");d.value="__other__",d.textContent="Other",y.appendChild(d)}if(a=y,b){let d=document.createElement("input");d.type="text",d.className="canopy-input canopy-select-other",d.name=`${e.name}_other`,d.placeholder="Please specify...",d.style.setProperty("display","none","important"),d.style.marginTop="0.5rem",d.addEventListener("input",()=>{d.setCustomValidity("")}),y.addEventListener("change",()=>{y.value==="__other__"?(d.style.setProperty("display","block","important"),e.required&&(d.required=!0)):(d.style.setProperty("display","none","important"),d.required=!1,d.value="")}),y.__otherInput=d}break}case"CHECKBOX":{let o=document.createElement("label");o.className="canopy-checkbox";let l=document.createElement("input");l.type="checkbox",l.id=n,l.name=e.name,l.addEventListener("change",()=>{l.setCustomValidity("")}),o.appendChild(l);let f=document.createElement("span");if(f.textContent=e.label||e.name,o.appendChild(f),t.appendChild(o),e.helpText){let b=document.createElement("p");b.className="canopy-help-text",b.textContent=e.helpText,t.appendChild(b)}let g=document.createElement("span");return g.className="canopy-error",g.id=`${n}-error`,t.appendChild(g),l.setAttribute("aria-describedby",g.id),l.setAttribute("aria-invalid","false"),{wrapper:t,input:l,errorEl:g}}case"CHECKBOXES":{let o=e.options,f=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o)?o.options:Array.isArray(o)?o:[],g=document.createElement("div");g.className="canopy-checkboxes",g.setAttribute("data-checkbox-group",e.name),f.forEach(d=>{let s=document.createElement("label");s.className="canopy-checkbox";let c=document.createElement("input");c.type="checkbox",c.name=e.name,c.value=d.value,c.addEventListener("change",()=>{let h=g.querySelector("input[type=checkbox]");h&&h.setCustomValidity("")});let p=document.createElement("span");p.textContent=d.label,s.appendChild(c),s.appendChild(p),g.appendChild(s)});let b=document.createElement("input");if(b.type="hidden",b.id=n,b.name=e.name,t.appendChild(r),t.appendChild(g),e.helpText){let d=document.createElement("p");d.className="canopy-help-text",d.textContent=e.helpText,t.appendChild(d)}let y=document.createElement("span");return y.className="canopy-error",y.id=`${n}-error`,t.appendChild(y),b.setAttribute("aria-describedby",y.id),b.setAttribute("aria-invalid","false"),{wrapper:t,input:b,errorEl:y}}case"EMAIL":{let o=document.createElement("input");o.type="email",o.className="canopy-input",a=o;break}case"PHONE":{let o=document.createElement("input");o.type="tel",o.setAttribute("inputmode","tel"),o.setAttribute("autocomplete","tel"),o.className="canopy-input",a=o;break}case"DATE":{let o=document.createElement("input");o.type="date",o.className="canopy-input";let l=e.validation;l&&(l.minDate&&(o.min=this.resolveDate(l.minDate)),l.maxDate&&(o.max=this.resolveDate(l.maxDate)),l.noFuture&&(o.max=new Date().toISOString().split("T")[0]),l.noPast&&(o.min=new Date().toISOString().split("T")[0])),a=o;break}case"NUMBER":{let o=document.createElement("input");o.type="number",o.className="canopy-input";let l=e.validation;l!=null&&l.integer?(o.setAttribute("inputmode","numeric"),o.setAttribute("step","1")):(o.setAttribute("inputmode","decimal"),o.setAttribute("step","any")),(l==null?void 0:l.min)!==void 0&&o.setAttribute("min",String(l.min)),(l==null?void 0:l.max)!==void 0&&o.setAttribute("max",String(l.max)),a=o;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);default:{let o=document.createElement("input");o.type="text",o.className="canopy-input",a=o}}a.id=n,a.name=e.name,a.setAttribute("aria-invalid","false"),e.placeholder&&a.setAttribute("placeholder",e.placeholder);let u=L(e);u&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=u),a.addEventListener("input",()=>{a.setCustomValidity("")});let m=document.createElement("span");if(m.className="canopy-error",m.id=`${n}-error`,a.setAttribute("aria-describedby",m.id),t.appendChild(r),t.appendChild(a),a.__otherInput&&t.appendChild(a.__otherInput),e.helpText){let o=document.createElement("p");o.className="canopy-help-text",o.textContent=e.helpText,t.appendChild(o)}return t.appendChild(m),{wrapper:t,input:a,errorEl:m}}resolveDate(e){return e==="today"?new Date().toISOString().split("T")[0]:e}createNameField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-name-group";let r=document.createElement("label");r.className="canopy-label",r.textContent=e.label||e.name,t.appendChild(r);let a=e.options||{parts:["first","last"]},u=a.parts||["first","last"],m=a.partLabels||{},o=a.partsRequired||{},l={first:"First Name",last:"Last Name",middle:"Middle Name",middleInitial:"M.I.",single:"Full Name"},f=document.createElement("div");f.className="canopy-name-parts";let g=document.createElement("input");g.type="hidden",g.id=n,g.name=e.name;let b=document.createElement("span");if(b.className="canopy-error",b.id=`${n}-error`,u.forEach(y=>{let d=document.createElement("div");d.className="canopy-name-part";let s=document.createElement("label");s.className="canopy-name-part-label";let c=`${n}-${y}`;if(s.htmlFor=c,s.textContent=m[y]||l[y]||y,e.required||o[y]){let h=document.createElement("span");h.className="canopy-required",h.textContent=" *",s.appendChild(h)}let p=document.createElement("input");p.type="text",p.className="canopy-input",p.id=c,p.name=`${e.name}.${y}`,p.setAttribute("data-name-part",y),p.setAttribute("data-name-field",e.name),p.addEventListener("input",()=>{f.querySelectorAll("input[data-name-part]").forEach(h=>h.setCustomValidity(""))}),d.appendChild(s),d.appendChild(p),f.appendChild(d)}),t.appendChild(f),e.helpText){let y=document.createElement("p");y.className="canopy-help-text",y.textContent=e.helpText,t.appendChild(y)}return t.appendChild(b),{wrapper:t,input:g,errorEl:b}}createAddressField(e){let n=`${this.instanceId}-${e.name}`,t=e.options||{},r=document.createElement("div");r.className="canopy-field canopy-address-group";let a=document.createElement("label");a.className="canopy-label",a.textContent=e.label||"Address",r.appendChild(a);let u=document.createElement("div");u.className="canopy-address-parts";let m=document.createElement("input");m.type="hidden",m.id=n,m.name=e.name;let o=document.createElement("span");o.className="canopy-error",o.id=`${n}-error`;let l=[{key:"line1",label:"Street Address",tag:"input"}];if(t.showLine2!==!1&&l.push({key:"line2",label:"Apt, Suite, etc.",tag:"input"}),l.push({key:"city",label:"City",tag:"input"},{key:"region",label:"State",tag:"select"},{key:"postalCode",label:"ZIP Code",tag:"input",attrs:{maxlength:"10",inputmode:"numeric"}}),l.forEach(f=>{let g=document.createElement("div");g.className="canopy-address-part";let b=document.createElement("label");b.className="canopy-address-part-label";let y=`${n}-${f.key}`;if(b.htmlFor=y,b.textContent=f.label,e.required&&f.key!=="line2"){let s=document.createElement("span");s.className="canopy-required",s.textContent=" *",b.appendChild(s)}let d;if(f.tag==="select"){let s=document.createElement("select");s.className="canopy-select";let c=document.createElement("option");c.value="",c.textContent="Select...",s.appendChild(c),H.forEach(p=>{let h=document.createElement("option");h.value=p.value,h.textContent=p.label,s.appendChild(h)}),s.addEventListener("change",()=>{u.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(p=>p.setCustomValidity(""))}),d=s}else{let s=document.createElement("input");s.type="text",s.className="canopy-input",f.attrs&&Object.entries(f.attrs).forEach(([c,p])=>s.setAttribute(c,p)),s.addEventListener("input",()=>{u.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(c=>c.setCustomValidity(""))}),d=s}d.id=y,d.setAttribute("data-address-part",f.key),d.setAttribute("data-address-field",e.name),g.appendChild(b),g.appendChild(d),u.appendChild(g)}),r.appendChild(u),e.helpText){let f=document.createElement("p");f.className="canopy-help-text",f.textContent=e.helpText,r.appendChild(f)}return r.appendChild(o),{wrapper:r,input:m,errorEl:o}}collectValues(){let e={};return this.fieldElements.forEach((n,t)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")e[t]=n.input.checked;else if(n.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${t}"]`);if(r){let a=[];r.querySelectorAll("input[type=checkbox]:checked").forEach(u=>{a.push(u.value)}),e[t]=a}else{let a=this.container.querySelectorAll(`input[data-name-field="${t}"]`);if(a.length>0){let u={};a.forEach(m=>{let o=m,l=o.getAttribute("data-name-part");l&&(u[l]=o.value)}),e[t]=u}else{let u=this.container.querySelectorAll(`input[data-address-field="${t}"], select[data-address-field="${t}"]`);if(u.length>0){let m={};u.forEach(o=>{let l=o.getAttribute("data-address-part");l&&(m[l]=o.value)}),e[t]=m}else e[t]=n.input.value}}}else e[t]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value==="__other__"&&n.input.__otherInput?e[t]=n.input.__otherInput.value:e[t]=n.input.value}),e}findFailingInput(e){let n=this.container.querySelectorAll(`input[data-name-field="${e}"]`);if(n.length>0){for(let a of n)if(!a.value.trim())return a;return n[0]}let t=["line1","city","region","postalCode"],r=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(r.length>0){for(let a of r){let u=a.getAttribute("data-address-part");if(u&&t.includes(u)&&!a.value.trim())return a}return r[0]}return null}showErrors(e){this.fieldElements.forEach((t,r)=>{let a=e[r]||"";if(t.input.type==="hidden"){let u=this.container.querySelector(`[data-checkbox-group="${r}"]`);if(u){let m=u.querySelector("input[type=checkbox]");m&&m.setCustomValidity(a)}else{let m=a?this.findFailingInput(r):null;m?m.setCustomValidity(a):this.container.querySelectorAll(`input[data-name-field="${r}"], input[data-address-field="${r}"], select[data-address-field="${r}"]`).forEach(l=>l.setCustomValidity(""))}}else t.input.setCustomValidity(a);t.errorEl.textContent=a,t.input.setAttribute("aria-invalid",a?"true":"false")});let n=Object.keys(e);if(n.length>0){let t=this.fieldElements.get(n[0]);if(t)if(t.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${n[0]}"]`);if(r){let a=r.querySelector("input[type=checkbox]");a&&(a.reportValidity(),a.focus())}else{let a=this.findFailingInput(n[0]);a&&(a.reportValidity(),a.focus())}}else t.input.reportValidity(),t.input.focus()}}setStatus(e,n){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(e){var r,a;if(e.preventDefault(),!this.formDefinition)return;this.setStatus("","info"),this.fieldElements.forEach((u,m)=>{if(u.input.setCustomValidity(""),u.input.type==="hidden"){let o=this.container.querySelector(`[data-checkbox-group="${m}"]`);if(o){let l=o.querySelector("input[type=checkbox]");l&&l.setCustomValidity("")}else this.container.querySelectorAll(`input[data-name-field="${m}"], input[data-address-field="${m}"], select[data-address-field="${m}"]`).forEach(f=>f.setCustomValidity(""))}});let n=this.collectValues(),t=I(this.formDefinition.fields,n);if(this.showErrors(t),Object.keys(t).length>0){let u=Object.keys(t).length;this.setStatus(`Please fix ${u} field${u>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let u=this.options.baseUrl||"",m=await fetch(`${u}/api/embed/${this.options.formId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),o=await m.json();if(!m.ok){o!=null&&o.fields&&this.showErrors(o.fields),this.setStatus((o==null?void 0:o.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}this.setStatus(this.formDefinition.successMessage||"Thanks for your submission!","success"),e.target.reset()}catch(u){console.error(u),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let u=((a=(r=this.formDefinition)==null?void 0:r.defaultTheme)==null?void 0:a.buttonText)||"Submit";this.submitButton.textContent=u,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderError(e){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=e,this.container.appendChild(n)}};var R=`
.canopy-root {
  font-family: var(--canopy-font, inherit);
  font-size: var(--canopy-font-size, 14px);
  color: var(--canopy-text, #18181b);
  background: var(--canopy-bg, #ffffff);
  padding: 4px;
  --canopy-heading-font: var(--canopy-font, inherit);
}

.canopy-form {
  display: grid;
  gap: 16px;
}

.canopy-form-actions {
  display: flex;
  justify-content: var(--canopy-button-align, left);
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
  font-size: var(--canopy-font-size, 14px);
  font-weight: var(--canopy-label-weight, 500);
  text-transform: var(--canopy-label-transform, none);
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
  font-family: inherit;
  font-size: var(--canopy-font-size, 14px);
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
  font-size: calc(var(--canopy-font-size, 14px) - 1px);
  color: #71717a;
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
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.canopy-name-part {
  display: grid;
  gap: 4px;
}

.canopy-name-part-label {
  font-size: calc(var(--canopy-font-size, 14px) - 1px);
  font-weight: 500;
  color: var(--canopy-text, #18181b);
}

.canopy-address-parts {
  display: grid;
  gap: 12px;
}

.canopy-address-part {
  display: grid;
  gap: 4px;
}

.canopy-address-part-label {
  font-size: calc(var(--canopy-font-size, 14px) - 1px);
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
  font-size: var(--canopy-font-size, 14px);
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
  font-size: var(--canopy-font-size, 14px);
}

.canopy-status.canopy-status-error {
  color: #FF6B5A;
}

.canopy-status.canopy-status-success {
  color: #5FD48C;
}

.canopy-header {
  margin-bottom: 16px;
}

.canopy-title {
  font-family: var(--canopy-heading-font, var(--canopy-font, inherit));
  font-size: var(--canopy-title-size, 1.25em);
  font-weight: var(--canopy-title-weight, 600);
  color: var(--canopy-title-color, var(--canopy-text, #18181b));
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.canopy-description {
  font-size: var(--canopy-font-size, 14px);
  color: var(--canopy-text, #18181b);
  opacity: 0.75;
  margin: 0;
  line-height: 1.5;
}
`;var q="canopy-embed-styles";function B(){if(document.getElementById(q))return;let i=document.createElement("style");i.id=q,i.textContent=R,document.head.appendChild(i)}function K(i){var e;return i.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function Z(i){let e=i.dataset.theme;if(e)try{return JSON.parse(e)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function w(){B(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=e.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let t=Z(e),r=K(e);new k(e,{formId:n,themeOverrides:t,baseUrl:r}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",w):w();window.CanopyForms={init:w};})();
