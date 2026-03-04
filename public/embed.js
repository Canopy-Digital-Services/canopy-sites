"use strict";(()=>{var E={fontSize:14,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:8,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:"md",titleWeight:"semibold",titleColor:void 0,labelWeight:"medium",labelTransform:"none",bodyFont:void 0,headingFont:void 0,fontUrl:void 0,fontFamily:void 0,buttonText:void 0},L=new Set;function C(l,t){if(!l)return t;let n=l.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:t:t}function N(l,t){return{...E,...l!=null?l:{},...t!=null?t:{}}}function P(l){let t=/^#?([0-9a-f]{6})$/i.exec(l.trim());if(!t)return null;let n=parseInt(t[1],16);return[n>>16&255,n>>8&255,n&255]}function z(l,t,n){let[e,r,a]=[l,t,n].map(d=>{let u=d/255;return u<=.03928?u/12.92:Math.pow((u+.055)/1.055,2.4)});return .2126*e+.7152*r+.0722*a}function V(l){try{let t=P(l);return t&&z(...t)>.179?"#18181b":"#ffffff"}catch(t){return"#ffffff"}}function $(l,t){var s,y,g,b,h;let n=w(t.bodyFont,t.fontFamily);l.style.setProperty("--canopy-font",n);let e=w(t.headingFont);l.style.setProperty("--canopy-heading-font",e==="inherit"?"var(--canopy-font)":e),l.style.setProperty("--canopy-font-size",`${(s=t.fontSize)!=null?s:E.fontSize}px`),l.style.setProperty("--canopy-text",C(t.text,E.text)),l.style.setProperty("--canopy-bg",C(t.background,E.background)),l.style.setProperty("--canopy-field-bg",C(t.fieldBackground,E.fieldBackground));let r=C(t.primary,E.primary);l.style.setProperty("--canopy-primary",r),l.style.setProperty("--canopy-button-text",V(r)),l.style.setProperty("--canopy-border",C(t.border,E.border)),l.style.setProperty("--canopy-radius",`${(y=t.radius)!=null?y:E.radius}px`),l.style.setProperty("--canopy-button-width",t.buttonWidth==="auto"?"auto":"100%"),l.style.setProperty("--canopy-button-align",t.buttonAlign||E.buttonAlign);let a={sm:"1em",md:"1.25em",lg:"1.5em",xl:"1.875em"};l.style.setProperty("--canopy-title-size",a[(g=t.titleSize)!=null?g:"md"]);let d={normal:"400",semibold:"600",bold:"700"};l.style.setProperty("--canopy-title-weight",d[(b=t.titleWeight)!=null?b:"semibold"]);let u=t.titleColor?C(t.titleColor,""):"";u?l.style.setProperty("--canopy-title-color",u):l.style.removeProperty("--canopy-title-color");let o={normal:"400",medium:"500",semibold:"600"};l.style.setProperty("--canopy-label-weight",o[(h=t.labelWeight)!=null?h:"medium"]),l.style.setProperty("--canopy-label-transform",t.labelTransform==="uppercase"?"uppercase":"none")}function M(l){switch(l.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function w(l,t){return l&&l!=="inherit"?`'${l}', sans-serif`:t&&t!=="inherit"?t:"inherit"}function D(l){let t=l.filter(a=>!!a&&a!=="inherit"&&!L.has(a));if(t.length===0)return;let e=`https://fonts.googleapis.com/css2?${t.map(a=>`family=${encodeURIComponent(a)}:wght@400;500;600;700`).join("&")}&display=swap`,r=document.createElement("link");r.rel="stylesheet",r.href=e,r.dataset.canopyFont="true",document.head.appendChild(r),t.forEach(a=>L.add(a))}function I(l){if(!l||L.has(l))return;let t=document.createElement("link");t.rel="stylesheet",t.href=l,t.dataset.canopyFont="true",document.head.appendChild(t),L.add(l)}var W={TEXT:200,EMAIL:254,TEXTAREA:2e3};function F(l){var t;return(t=l.validation)!=null&&t.maxLength?l.validation.maxLength:W[l.type]}function U(l){return l.label||l.name}function O(l,t){let n={};return l.forEach(e=>{var o,s,y,g,b,h,m;let r=t[e.name],a=U(e);if(e.required){if(e.type==="CHECKBOX"){if(!r){n[e.name]=`${a} is required.`;return}}else if(e.type==="CHECKBOXES"){if(!Array.isArray(r)||r.length===0){n[e.name]=`${a} is required.`;return}}else if(e.type!=="NAME"){if(e.type!=="ADDRESS"){if(r==null||String(r).trim()===""){n[e.name]=`${a} is required.`;return}}}}if(e.type==="CHECKBOXES"){if(Array.isArray(r)&&r.length>0){let i=e.options,p=i&&typeof i=="object"&&"options"in i?i.options.map(f=>f.value):[];for(let f of r)if(!p.includes(String(f))){n[e.name]=`${a} contains an invalid option.`;return}}return}if(!(e.type==="NAME"||e.type==="ADDRESS")){if(r==null||String(r).trim()==="")return}if(e.type==="EMAIL"){let i=String(r);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(i)){n[e.name]="Enter a valid email address";return}let p=(o=e.validation)==null?void 0:o.domainRules;if(p){let f=(s=i.split("@")[1])==null?void 0:s.toLowerCase();if(p.allow&&p.allow.length>0&&!p.allow.map(v=>v.toLowerCase()).includes(f)){n[e.name]=`${a} must be from an allowed domain.`;return}if(p.block&&p.block.length>0&&p.block.map(v=>v.toLowerCase()).includes(f)){n[e.name]=`${a} domain is not allowed.`;return}}}if(e.type==="PHONE"){let i=String(r),c=((y=e.validation)==null?void 0:y.format)||"lenient";if(c==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(i)){n[e.name]=`${a} must be a valid phone number.`;return}}else if(c==="strict"){let p=i.replace(/[^\d+]/g,"");if(p.startsWith("+1"))p=p.substring(2);else if(p.startsWith("+")){n[e.name]=`${a} must be a valid US phone number (10 digits).`;return}else p.startsWith("1")&&p.length===11&&(p=p.substring(1));if(!/^\d{10}$/.test(p)){n[e.name]=`${a} must be a valid US phone number (10 digits).`;return}}return}if(e.type==="DATE"){let i=String(r),c=new Date(i);if(isNaN(c.getTime())){n[e.name]=`${a} must be a valid date.`;return}let p=new Date;p.setHours(0,0,0,0),c.setHours(0,0,0,0);let f=e.validation;if(f!=null&&f.noFuture&&c>p){n[e.name]=`${a} cannot be a future date.`;return}if(f!=null&&f.noPast&&c<p){n[e.name]=`${a} cannot be a past date.`;return}if(f!=null&&f.minDate){let x=new Date(f.minDate==="today"?p:f.minDate);if(x.setHours(0,0,0,0),c<x){n[e.name]=`${a} must be on or after ${x.toLocaleDateString()}.`;return}}if(f!=null&&f.maxDate){let x=new Date(f.maxDate==="today"?p:f.maxDate);if(x.setHours(0,0,0,0),c>x){n[e.name]=`${a} must be on or before ${x.toLocaleDateString()}.`;return}}}if(e.type==="NUMBER"){let i=Number(r);if(isNaN(i)){n[e.name]=`${a} must be a number.`;return}let c=e.validation;if(c!=null&&c.integer&&!Number.isInteger(i)){n[e.name]=`${a} must be a whole number.`;return}if((c==null?void 0:c.min)!==void 0&&i<c.min){n[e.name]=`${a} must be at least ${c.min}.`;return}if((c==null?void 0:c.max)!==void 0&&i>c.max){n[e.name]=`${a} must be at most ${c.max}.`;return}return}if(e.type==="NAME"){let i=r,c=e.options||{parts:["first","last"]},p=c.parts||["first","last"],f=c.partsRequired||{};for(let x of p){let v=i[x];if((e.required||f[x])&&(!v||v.trim()==="")){let S=((g=c.partLabels)==null?void 0:g[x])||x;n[e.name]=`${S} is required.`;return}}return}if(e.type==="ADDRESS"){let i=r,c=e.options||{},p=["line1","city","region","postalCode"];if(!(c.showLine2!==!1?["line1","line2","city","region","postalCode"]:p).some(T=>{var S;return(S=i==null?void 0:i[T])==null?void 0:S.trim()})&&!e.required)return;let v={line1:"Street address",city:"City",region:"State",postalCode:"ZIP code"};for(let T of p)if(!((b=i==null?void 0:i[T])!=null&&b.trim())){n[e.name]=`${v[T]} is required.`;return}return}if(e.type==="DROPDOWN"&&Array.isArray(e.options)&&!e.options.map(c=>c.value).includes(String(r))){n[e.name]=`${a} must be a valid option.`;return}let d=String(r),u=F(e);if((h=e.validation)!=null&&h.minLength&&d.length<e.validation.minLength){n[e.name]=`${a} must be at least ${e.validation.minLength} characters.`;return}if(u&&d.length>u){n[e.name]=`${a} must be at most ${u} characters.`;return}if(e.type==="TEXT"||e.type==="TEXTAREA"){let i=(m=e.validation)==null?void 0:m.format;if(i&&i!=="alphanumeric"){let c=!0,p=`${a} is invalid.`;switch(i){case"numbers":c=/^\d+$/.test(d),p=`${a} must contain only numbers.`;break;case"letters":c=/^[A-Za-z]+$/.test(d),p=`${a} must contain only letters.`;break;case"url":{let f=d.startsWith("http")?d:`https://${d}`;try{c=new URL(f).hostname.includes(".")}catch(x){c=!1}p=`${a} must be a valid URL.`;break}case"postal-us":c=/^\d{5}(-\d{4})?$/.test(d),p=`${a} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":c=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(d),p=`${a} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}c||(n[e.name]=p)}}}),n}var H=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var _=0,A=class{constructor(t,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.submitButton=null;this.instanceId=`canopy-${_++}`;this.container=t,this.options=n}async init(){try{this.container.classList.add("canopy-root");let t=await this.fetchDefinition();this.formDefinition=t,this.render(t)}catch(t){console.error(t),this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var r;let t=this.options.baseUrl||"",n=this.options.formId||((r=this.formDefinition)==null?void 0:r.formId);if(!n)throw new Error("Form configuration error: no formId");let e=await fetch(`${t}/api/embed/${n}`,{method:"GET",credentials:"omit"});if(!e.ok)throw new Error("Failed to load form definition");return e.json()}renderFromDefinition(t){this.container.classList.add("canopy-root"),this.formDefinition=t,this.render(t)}render(t){this.container.innerHTML="",this.fieldElements.clear();let n=N(t.defaultTheme,this.options.themeOverrides);if($(this.container,n),D([n.bodyFont,n.headingFont]),!n.bodyFont&&!n.headingFont&&I(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(M(n)),!t.fields||t.fields.length===0){this.renderError("This form is not configured yet.");return}if(t.title||t.description){let b=document.createElement("div");if(b.className="canopy-header",t.title){let h=document.createElement("h2");h.className="canopy-title",h.textContent=t.title,b.appendChild(h)}if(t.description){let h=document.createElement("p");h.className="canopy-description",h.textContent=t.description,b.appendChild(h)}this.container.appendChild(b)}let e=document.createElement("div");e.className="canopy-status",e.setAttribute("role","status"),this.statusEl=e;let r=document.createElement("form");r.className="canopy-form",r.addEventListener("submit",b=>this.handleSubmit(b)),t.fields.forEach(b=>{let{wrapper:h,input:m,errorEl:i}=this.createField(b);h&&r.appendChild(h),this.fieldElements.set(b.name,{input:m,errorEl:i})});let a=document.createElement("button");a.type="submit",a.className="canopy-submit",a.textContent=n.buttonText||"Submit";let d=getComputedStyle(this.container),u=d.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",o=d.getPropertyValue("--canopy-button-text").trim()||"#ffffff",s=d.getPropertyValue("--canopy-radius").trim()||"8px",y=d.getPropertyValue("--canopy-button-width").trim()||"100%";a.style.cssText=`
      display: block !important;
      width: ${y} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${s} !important;
      padding: 10px 16px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: ${u} !important;
      background-color: ${u} !important;
      color: ${o} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=a;let g=document.createElement("div");g.className="canopy-form-actions",g.appendChild(a),r.appendChild(g),this.container.appendChild(e),this.container.appendChild(r)}createField(t){let n=`${this.instanceId}-${t.name}`,e=document.createElement("div");e.className="canopy-field";let r=document.createElement("label");if(r.className="canopy-label",r.htmlFor=n,r.textContent=t.label||t.name,t.required){let o=document.createElement("span");o.className="canopy-required",o.textContent=" *",r.appendChild(o)}let a;switch(t.type){case"TEXTAREA":{let o=document.createElement("textarea");o.className="canopy-textarea";let s=F(t);if(s){let y=Math.min(Math.max(Math.ceil(s/60),4),15);o.rows=y}else o.rows=4;a=o;break}case"DROPDOWN":{let o=t.options,s=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o),y=s?o.options:Array.isArray(o)?o:[],g=s?o.defaultValue:void 0,b=s?o.allowOther:!1,h=document.createElement("select");if(h.className="canopy-select",y.forEach(m=>{let i=document.createElement("option");i.value=m.value,i.textContent=m.label,g&&m.value===g&&(i.selected=!0),h.appendChild(i)}),b){let m=document.createElement("option");m.value="__other__",m.textContent="Other",h.appendChild(m)}if(a=h,b){let m=document.createElement("input");m.type="text",m.className="canopy-input canopy-select-other",m.name=`${t.name}_other`,m.placeholder="Please specify...",m.style.setProperty("display","none","important"),m.style.marginTop="0.5rem",m.addEventListener("input",()=>{m.setCustomValidity("")}),h.addEventListener("change",()=>{h.value==="__other__"?(m.style.setProperty("display","block","important"),t.required&&(m.required=!0)):(m.style.setProperty("display","none","important"),m.required=!1,m.value="")}),h.__otherInput=m}break}case"CHECKBOX":{let o=document.createElement("label");o.className="canopy-checkbox";let s=document.createElement("input");s.type="checkbox",s.id=n,s.name=t.name,s.addEventListener("change",()=>{s.setCustomValidity("")}),o.appendChild(s);let y=document.createElement("span");if(y.textContent=t.label||t.name,o.appendChild(y),e.appendChild(o),t.helpText){let b=document.createElement("p");b.className="canopy-help-text",b.textContent=t.helpText,e.appendChild(b)}let g=document.createElement("span");return g.className="canopy-error",g.id=`${n}-error`,e.appendChild(g),s.setAttribute("aria-describedby",g.id),s.setAttribute("aria-invalid","false"),{wrapper:e,input:s,errorEl:g}}case"CHECKBOXES":{let o=t.options,y=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o)?o.options:Array.isArray(o)?o:[],g=document.createElement("div");g.className="canopy-checkboxes",g.setAttribute("data-checkbox-group",t.name),y.forEach(m=>{let i=document.createElement("label");i.className="canopy-checkbox";let c=document.createElement("input");c.type="checkbox",c.name=t.name,c.value=m.value,c.addEventListener("change",()=>{let f=g.querySelector("input[type=checkbox]");f&&f.setCustomValidity("")});let p=document.createElement("span");p.textContent=m.label,i.appendChild(c),i.appendChild(p),g.appendChild(i)});let b=document.createElement("input");if(b.type="hidden",b.id=n,b.name=t.name,e.appendChild(r),e.appendChild(g),t.helpText){let m=document.createElement("p");m.className="canopy-help-text",m.textContent=t.helpText,e.appendChild(m)}let h=document.createElement("span");return h.className="canopy-error",h.id=`${n}-error`,e.appendChild(h),b.setAttribute("aria-describedby",h.id),b.setAttribute("aria-invalid","false"),{wrapper:e,input:b,errorEl:h}}case"EMAIL":{let o=document.createElement("input");o.type="email",o.className="canopy-input",a=o;break}case"PHONE":{let o=document.createElement("input");o.type="tel",o.setAttribute("inputmode","tel"),o.setAttribute("autocomplete","tel"),o.className="canopy-input",a=o;break}case"DATE":{let o=document.createElement("input");o.type="date",o.className="canopy-input";let s=t.validation;s&&(s.minDate&&(o.min=this.resolveDate(s.minDate)),s.maxDate&&(o.max=this.resolveDate(s.maxDate)),s.noFuture&&(o.max=new Date().toISOString().split("T")[0]),s.noPast&&(o.min=new Date().toISOString().split("T")[0])),a=o;break}case"NUMBER":{let o=document.createElement("input");o.type="number",o.className="canopy-input";let s=t.validation;s!=null&&s.integer?(o.setAttribute("inputmode","numeric"),o.setAttribute("step","1")):(o.setAttribute("inputmode","decimal"),o.setAttribute("step","any")),(s==null?void 0:s.min)!==void 0&&o.setAttribute("min",String(s.min)),(s==null?void 0:s.max)!==void 0&&o.setAttribute("max",String(s.max)),a=o;break}case"NAME":return this.createNameField(t);case"ADDRESS":return this.createAddressField(t);default:{let o=document.createElement("input");o.type="text",o.className="canopy-input",a=o}}a.id=n,a.name=t.name,a.setAttribute("aria-invalid","false"),t.placeholder&&a.setAttribute("placeholder",t.placeholder);let d=F(t);d&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=d),a.addEventListener("input",()=>{a.setCustomValidity("")});let u=document.createElement("span");if(u.className="canopy-error",u.id=`${n}-error`,a.setAttribute("aria-describedby",u.id),e.appendChild(r),e.appendChild(a),a.__otherInput&&e.appendChild(a.__otherInput),t.helpText){let o=document.createElement("p");o.className="canopy-help-text",o.textContent=t.helpText,e.appendChild(o)}return e.appendChild(u),{wrapper:e,input:a,errorEl:u}}resolveDate(t){return t==="today"?new Date().toISOString().split("T")[0]:t}createNameField(t){let n=`${this.instanceId}-${t.name}`,e=document.createElement("div");e.className="canopy-field canopy-name-group";let r=document.createElement("label");r.className="canopy-label",r.textContent=t.label||t.name,e.appendChild(r);let a=t.options||{parts:["first","last"]},d=a.parts||["first","last"],u=a.partLabels||{},o=a.partsRequired||{},s={first:"First Name",last:"Last Name",middle:"Middle Name",middleInitial:"M.I.",single:"Full Name"},y=document.createElement("div");y.className="canopy-name-parts";let g=document.createElement("input");g.type="hidden",g.id=n,g.name=t.name;let b=document.createElement("span");if(b.className="canopy-error",b.id=`${n}-error`,d.forEach(h=>{let m=document.createElement("div");m.className="canopy-name-part";let i=document.createElement("label");i.className="canopy-name-part-label";let c=`${n}-${h}`;if(i.htmlFor=c,i.textContent=u[h]||s[h]||h,t.required||o[h]){let f=document.createElement("span");f.className="canopy-required",f.textContent=" *",i.appendChild(f)}let p=document.createElement("input");p.type="text",p.className="canopy-input",p.id=c,p.name=`${t.name}.${h}`,p.setAttribute("data-name-part",h),p.setAttribute("data-name-field",t.name),p.addEventListener("input",()=>{y.querySelectorAll("input[data-name-part]").forEach(f=>f.setCustomValidity(""))}),m.appendChild(i),m.appendChild(p),y.appendChild(m)}),e.appendChild(y),t.helpText){let h=document.createElement("p");h.className="canopy-help-text",h.textContent=t.helpText,e.appendChild(h)}return e.appendChild(b),{wrapper:e,input:g,errorEl:b}}createAddressField(t){let n=`${this.instanceId}-${t.name}`,e=t.options||{},r=document.createElement("div");r.className="canopy-field canopy-address-group";let a=document.createElement("label");a.className="canopy-label",a.textContent=t.label||"Address",r.appendChild(a);let d=document.createElement("div");d.className="canopy-address-parts";let u=document.createElement("input");u.type="hidden",u.id=n,u.name=t.name;let o=document.createElement("span");o.className="canopy-error",o.id=`${n}-error`;let s=[{key:"line1",label:"Street Address",tag:"input"}];if(e.showLine2!==!1&&s.push({key:"line2",label:"Apt, Suite, etc.",tag:"input"}),s.push({key:"city",label:"City",tag:"input"},{key:"region",label:"State",tag:"select"},{key:"postalCode",label:"ZIP Code",tag:"input",attrs:{maxlength:"10",inputmode:"numeric"}}),s.forEach(y=>{let g=document.createElement("div");g.className="canopy-address-part";let b=document.createElement("label");b.className="canopy-address-part-label";let h=`${n}-${y.key}`;if(b.htmlFor=h,b.textContent=y.label,t.required&&y.key!=="line2"){let i=document.createElement("span");i.className="canopy-required",i.textContent=" *",b.appendChild(i)}let m;if(y.tag==="select"){let i=document.createElement("select");i.className="canopy-select";let c=document.createElement("option");c.value="",c.textContent="Select...",i.appendChild(c),H.forEach(p=>{let f=document.createElement("option");f.value=p.value,f.textContent=p.label,i.appendChild(f)}),i.addEventListener("change",()=>{d.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(p=>p.setCustomValidity(""))}),m=i}else{let i=document.createElement("input");i.type="text",i.className="canopy-input",y.attrs&&Object.entries(y.attrs).forEach(([c,p])=>i.setAttribute(c,p)),i.addEventListener("input",()=>{d.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(c=>c.setCustomValidity(""))}),m=i}m.id=h,m.setAttribute("data-address-part",y.key),m.setAttribute("data-address-field",t.name),g.appendChild(b),g.appendChild(m),d.appendChild(g)}),r.appendChild(d),t.helpText){let y=document.createElement("p");y.className="canopy-help-text",y.textContent=t.helpText,r.appendChild(y)}return r.appendChild(o),{wrapper:r,input:u,errorEl:o}}collectValues(){let t={};return this.fieldElements.forEach((n,e)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")t[e]=n.input.checked;else if(n.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${e}"]`);if(r){let a=[];r.querySelectorAll("input[type=checkbox]:checked").forEach(d=>{a.push(d.value)}),t[e]=a}else{let a=this.container.querySelectorAll(`input[data-name-field="${e}"]`);if(a.length>0){let d={};a.forEach(u=>{let o=u,s=o.getAttribute("data-name-part");s&&(d[s]=o.value)}),t[e]=d}else{let d=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(d.length>0){let u={};d.forEach(o=>{let s=o.getAttribute("data-address-part");s&&(u[s]=o.value)}),t[e]=u}else t[e]=n.input.value}}}else t[e]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value==="__other__"&&n.input.__otherInput?t[e]=n.input.__otherInput.value:t[e]=n.input.value}),t}findFailingInput(t){let n=this.container.querySelectorAll(`input[data-name-field="${t}"]`);if(n.length>0){for(let a of n)if(!a.value.trim())return a;return n[0]}let e=["line1","city","region","postalCode"],r=this.container.querySelectorAll(`input[data-address-field="${t}"], select[data-address-field="${t}"]`);if(r.length>0){for(let a of r){let d=a.getAttribute("data-address-part");if(d&&e.includes(d)&&!a.value.trim())return a}return r[0]}return null}showErrors(t){this.fieldElements.forEach((e,r)=>{let a=t[r]||"";if(e.input.type==="hidden"){let d=this.container.querySelector(`[data-checkbox-group="${r}"]`);if(d){let u=d.querySelector("input[type=checkbox]");u&&u.setCustomValidity(a)}else{let u=a?this.findFailingInput(r):null;u?u.setCustomValidity(a):this.container.querySelectorAll(`input[data-name-field="${r}"], input[data-address-field="${r}"], select[data-address-field="${r}"]`).forEach(s=>s.setCustomValidity(""))}}else e.input.setCustomValidity(a);e.errorEl.textContent=a,e.input.setAttribute("aria-invalid",a?"true":"false")});let n=Object.keys(t);if(n.length>0){let e=this.fieldElements.get(n[0]);if(e)if(e.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${n[0]}"]`);if(r){let a=r.querySelector("input[type=checkbox]");a&&(a.reportValidity(),a.focus())}else{let a=this.findFailingInput(n[0]);a&&(a.reportValidity(),a.focus())}}else e.input.reportValidity(),e.input.focus()}}setStatus(t,n){this.statusEl&&(this.statusEl.textContent=t,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(t){var r,a,d;if(t.preventDefault(),!this.formDefinition)return;this.setStatus("","info"),this.fieldElements.forEach((u,o)=>{if(u.input.setCustomValidity(""),u.input.type==="hidden"){let s=this.container.querySelector(`[data-checkbox-group="${o}"]`);if(s){let y=s.querySelector("input[type=checkbox]");y&&y.setCustomValidity("")}else this.container.querySelectorAll(`input[data-name-field="${o}"], input[data-address-field="${o}"], select[data-address-field="${o}"]`).forEach(g=>g.setCustomValidity(""))}});let n=this.collectValues(),e=O(this.formDefinition.fields,n);if(this.showErrors(e),Object.keys(e).length>0){let u=Object.keys(e).length;this.setStatus(`Please fix ${u} field${u>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let u=this.options.baseUrl||"",o=this.options.formId||((r=this.formDefinition)==null?void 0:r.formId);if(!o){this.setStatus("Form configuration error.","error");return}let s=await fetch(`${u}/api/embed/${o}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),y=await s.json();if(!s.ok){y!=null&&y.fields&&this.showErrors(y.fields),this.setStatus((y==null?void 0:y.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}this.setStatus(this.formDefinition.successMessage||"Thanks for your submission!","success"),t.target.reset()}catch(u){console.error(u),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let u=((d=(a=this.formDefinition)==null?void 0:a.defaultTheme)==null?void 0:d.buttonText)||"Submit";this.submitButton.textContent=u,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderError(t){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=t,this.container.appendChild(n)}};var R=`
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
  font-family: var(--canopy-font, inherit);
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
`;var q="canopy-embed-styles";function B(){if(document.getElementById(q))return;let l=document.createElement("style");l.id=q,l.textContent=R,document.head.appendChild(l)}function K(l){var t;return l.dataset.baseUrl||((t=document.querySelector("script[data-base-url]"))==null?void 0:t.getAttribute("data-base-url"))||""}function Z(l){let t=l.dataset.theme;if(t)try{return JSON.parse(t)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function k(){B(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(t=>{if(t.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=t.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}t.dataset.canopyInitialized="true";let e=Z(t),r=K(t);new A(t,{formId:n,themeOverrides:e,baseUrl:r}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",k):k();window.CanopyForms={init:k,CanopyForm:A};})();
