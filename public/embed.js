"use strict";(()=>{var C={fontSize:14,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:4,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:"md",titleWeight:"normal",labelSize:"md",labelWeight:"medium",labelTransform:"none"},N=new Set;function T(i,e){if(!i)return e;let a=i.trim();return a?/^var\(/i.test(a)||/^rgb/i.test(a)||/^hsl/i.test(a)||/^color\(/i.test(a)||/^(transparent|currentcolor|inherit)$/i.test(a)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(a)?a:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(a)?`#${a}`:e:e}function I(i,e){return{...C,...i!=null?i:{},...e!=null?e:{}}}function B(i){let e=/^#?([0-9a-f]{6})$/i.exec(i.trim());if(!e)return null;let a=parseInt(e[1],16);return[a>>16&255,a>>8&255,a&255]}function _(i,e,a){let[t,r,n]=[i,e,a].map(c=>{let d=c/255;return d<=.03928?d/12.92:Math.pow((d+.055)/1.055,2.4)});return .2126*t+.7152*r+.0722*n}function U(i){try{let e=B(i);return e&&_(...e)>.179?"#18181b":"#ffffff"}catch(e){return"#ffffff"}}function O(i,e){var s,m,b,g,h,p;let a=M(e.bodyFont,e.fontFamily);i.style.setProperty("--canopy-font",a);let t=M(e.headingFont);i.style.setProperty("--canopy-heading-font",t==="inherit"?"var(--canopy-font)":t),i.style.setProperty("--canopy-font-size",`${(s=e.fontSize)!=null?s:C.fontSize}px`),i.style.setProperty("--canopy-text",T(e.text,C.text)),i.style.setProperty("--canopy-bg",T(e.background,C.background)),i.style.setProperty("--canopy-field-bg",T(e.fieldBackground,C.fieldBackground));let r=T(e.primary,C.primary);i.style.setProperty("--canopy-primary",r),i.style.setProperty("--canopy-button-text",U(r)),i.style.setProperty("--canopy-border",T(e.border,C.border)),i.style.setProperty("--canopy-radius",`${(m=e.radius)!=null?m:C.radius}px`),i.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),i.style.setProperty("--canopy-button-align",e.buttonAlign||C.buttonAlign);let n={sm:"1.25em",md:"1.5em",lg:"1.875em",xl:"2.25em"};i.style.setProperty("--canopy-title-size",n[(b=e.titleSize)!=null?b:"md"]),i.style.setProperty("--canopy-label-size",n[(g=e.labelSize)!=null?g:"md"]);let c={light:"300",normal:"400",bold:"700",semibold:"700"},d=(h=e.titleWeight)!=null?h:"normal";i.style.setProperty("--canopy-title-weight",(p=c[d])!=null?p:"400");let o=e.titleColor?T(e.titleColor,""):"";o?i.style.setProperty("--canopy-title-color",o):i.style.removeProperty("--canopy-title-color"),i.style.setProperty("--canopy-heading-transform",e.labelTransform==="uppercase"?"uppercase":"none")}function H(i){switch(i.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function M(i,e){return i&&i!=="inherit"?`'${i}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function z(i){let e=i.filter(n=>!!n&&n!=="inherit"&&!N.has(n));if(e.length===0)return;let t=`https://fonts.googleapis.com/css2?${e.map(n=>`family=${encodeURIComponent(n)}:wght@300;400;700`).join("&")}&display=swap`,r=document.createElement("link");r.rel="stylesheet",r.href=t,r.dataset.canopyFont="true",document.head.appendChild(r),e.forEach(n=>N.add(n))}function R(i){if(!i||N.has(i))return;let e=document.createElement("link");e.rel="stylesheet",e.href=i,e.dataset.canopyFont="true",document.head.appendChild(e),N.add(i)}var K={TEXT:200,EMAIL:254,TEXTAREA:2e3};function L(i){var e;return(e=i.validation)!=null&&e.maxLength?i.validation.maxLength:K[i.type]}function j(i){return i.label||i.name}function q(i,e){let a={};return i.forEach(t=>{var o,s,m,b,g,h,p,y,v;let r=e[t.name],n=j(t);if(t.required){if(t.type==="CHECKBOX"){if(!r){a[t.name]=`${n} is required.`;return}}else if(t.type==="CHECKBOXES"){if(!Array.isArray(r)||r.length===0){a[t.name]=`${n} is required.`;return}}else if(t.type!=="NAME"){if(t.type!=="ADDRESS"){if(r==null||String(r).trim()===""){a[t.name]=`${n} is required.`;return}}}}if(t.type==="CHECKBOXES"){if(Array.isArray(r)&&r.length>0){let l=t.options,f=l&&typeof l=="object"&&"options"in l?l.options.map(x=>x.value):[];for(let x of r)if(!f.includes(String(x))){a[t.name]=`${n} contains an invalid option.`;return}}return}if(!(t.type==="NAME"||t.type==="ADDRESS")){if(r==null||String(r).trim()==="")return}if(t.type==="EMAIL"){let l=String(r);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(l)){a[t.name]="Enter a valid email address";return}let f=(o=t.validation)==null?void 0:o.domainRules;if(f){let x=(s=l.split("@")[1])==null?void 0:s.toLowerCase();if(f.allow&&f.allow.length>0&&!f.allow.map(k=>k.toLowerCase()).includes(x)){a[t.name]=`${n} must be from an allowed domain.`;return}if(f.block&&f.block.length>0&&f.block.map(k=>k.toLowerCase()).includes(x)){a[t.name]=`${n} domain is not allowed.`;return}}}if(t.type==="PHONE"){let l=String(r),u=((m=t.validation)==null?void 0:m.format)||"lenient";if(u==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(l)){a[t.name]=`${n} must be a valid phone number.`;return}}else if(u==="strict"){let f=l.replace(/[^\d+]/g,"");if(f.startsWith("+1"))f=f.substring(2);else if(f.startsWith("+")){a[t.name]=`${n} must be a valid US phone number (10 digits).`;return}else f.startsWith("1")&&f.length===11&&(f=f.substring(1));if(!/^\d{10}$/.test(f)){a[t.name]=`${n} must be a valid US phone number (10 digits).`;return}}return}if(t.type==="DATE"){let l=String(r),u=new Date(l);if(isNaN(u.getTime())){a[t.name]=`${n} must be a valid date.`;return}let f=new Date;f.setHours(0,0,0,0),u.setHours(0,0,0,0);let x=t.validation;if(x!=null&&x.minDate){let E=new Date(x.minDate==="today"?f:x.minDate);if(E.setHours(0,0,0,0),u<E){a[t.name]=`${n} must be on or after ${E.toLocaleDateString()}.`;return}}if(x!=null&&x.maxDate){let E=new Date(x.maxDate==="today"?f:x.maxDate);if(E.setHours(0,0,0,0),u>E){a[t.name]=`${n} must be on or before ${E.toLocaleDateString()}.`;return}}}if(t.type==="NUMBER"){let l=Number(r);if(isNaN(l)){a[t.name]=`${n} must be a number.`;return}let u=t.validation;if(u!=null&&u.integer&&!Number.isInteger(l)){a[t.name]=`${n} must be a whole number.`;return}if((u==null?void 0:u.min)!==void 0&&l<u.min){a[t.name]=`${n} must be at least ${u.min}.`;return}if((u==null?void 0:u.max)!==void 0&&l>u.max){a[t.name]=`${n} must be at most ${u.max}.`;return}return}if(t.type==="NAME"){let l=r,u=t.options||{parts:["first","last"]},f=u.parts||["first","last"],x=u.partsRequired||{};for(let E of f){let k=l[E];if((t.required||x[E])&&(!k||k.trim()==="")){let A=((b=u.partLabels)==null?void 0:b[E])||E;a[t.name]=`${A} is required.`;return}}return}if(t.type==="ADDRESS"){let l=r,u=t.options||{},f=["line1","city","region","postalCode"];if(!(u.showLine2!==!1?["line1","line2","city","region","postalCode"]:f).some(A=>{var D;return(D=l==null?void 0:l[A])==null?void 0:D.trim()})&&!t.required)return;let k={line1:"Street address",city:"City",region:"State",postalCode:"ZIP code"};for(let A of f)if(!((g=l==null?void 0:l[A])!=null&&g.trim())){a[t.name]=`${k[A]} is required.`;return}let $=(p=(h=l==null?void 0:l.postalCode)==null?void 0:h.trim())!=null?p:"";if(!/^\d{5}(-\d{4})?$/.test($)){a[t.name]="ZIP code must be a valid US postal code (e.g., 12345 or 12345-6789).";return}return}if(t.type==="DROPDOWN"){let l=t.options,u=l!=null&&typeof l=="object"&&!Array.isArray(l)&&"options"in l,f=u?l.options.map(E=>E.value):Array.isArray(l)?l.map(E=>E.value):[],x=u&&l.allowOther===!0;if(f.length>0&&!x&&!f.includes(String(r))){a[t.name]=`${n} must be a valid option.`;return}}let c=String(r),d=L(t);if((y=t.validation)!=null&&y.minLength&&c.length<t.validation.minLength){a[t.name]=`${n} must be at least ${t.validation.minLength} characters.`;return}if(d&&c.length>d){a[t.name]=`${n} must be at most ${d} characters.`;return}if(t.type==="TEXT"||t.type==="TEXTAREA"){let l=(v=t.validation)==null?void 0:v.format;if(l&&l!=="alphanumeric"){let u=!0,f=`${n} is invalid.`;switch(l){case"numbers":u=/^\d+$/.test(c),f=`${n} must contain only numbers.`;break;case"letters":u=/^[A-Za-z]+$/.test(c),f=`${n} must contain only letters.`;break;case"url":{let x=c.startsWith("http")?c:`https://${c}`;try{u=new URL(x).hostname.includes(".")}catch(E){u=!1}f=`${n} must be a valid URL.`;break}case"postal-us":u=/^\d{5}(-\d{4})?$/.test(c),f=`${n} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":u=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(c),f=`${n} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}u||(a[t.name]=f)}}}),a}var P=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var Z=0,S=class extends Error{constructor(e){super(e),this.name="InactiveFormError"}},w=class{constructor(e,a){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.formEl=null;this.submitButton=null;this.instanceId=`canopy-${Z++}`;this.container=e,this.options=a}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){if(console.error(e),e instanceof S){this.renderInactive();return}this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var r;let e=this.options.baseUrl||"",a=this.options.formId||((r=this.formDefinition)==null?void 0:r.formId);if(!a)throw new Error("Form configuration error: no formId");let t=await fetch(`${e}/api/embed/${a}`,{method:"GET",credentials:"omit"});if(!t.ok){if(t.status===403)try{let n=await t.json();if((n==null?void 0:n.code)==="FORM_INACTIVE")throw new S(n.error||"Form is inactive")}catch(n){if(n instanceof S)throw n}throw new Error("Failed to load form definition")}return t.json()}renderFromDefinition(e){this.container.classList.add("canopy-root"),this.formDefinition=e,this.render(e)}render(e){this.container.innerHTML="",this.fieldElements.clear();let a=I(e.defaultTheme,this.options.themeOverrides);O(this.container,a),z([a.bodyFont,a.headingFont]),!a.bodyFont&&!a.headingFont&&R(a.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(H(a));let t=e.fields&&e.fields.length>0,r=e.title||e.description;if(!t&&!r){this.renderSkeleton();return}if(e.title||e.description){let p=document.createElement("div");if(p.className="canopy-header",e.title){let y=document.createElement("h2");y.className="canopy-title",y.textContent=e.title,p.appendChild(y)}if(e.description){let y=document.createElement("p");y.className="canopy-description",y.textContent=e.description,p.appendChild(y)}this.container.appendChild(p)}let n=document.createElement("div");n.className="canopy-status",n.setAttribute("role","status"),this.statusEl=n;let c=document.createElement("form");c.className="canopy-form",c.addEventListener("submit",p=>this.handleSubmit(p)),this.formEl=c,e.fields.forEach(p=>{let{wrapper:y,input:v,errorEl:l}=this.createField(p);y&&c.appendChild(y),this.fieldElements.set(p.name,{input:v,errorEl:l})});let d=document.createElement("button");d.type="submit",d.className="canopy-submit",d.textContent=a.buttonText||"Submit";let o=getComputedStyle(this.container),s=o.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",m=o.getPropertyValue("--canopy-button-text").trim()||"#ffffff",b=o.getPropertyValue("--canopy-radius").trim()||"8px",g=o.getPropertyValue("--canopy-button-width").trim()||"100%";d.style.cssText=`
      display: block !important;
      width: ${g} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${b} !important;
      padding: 10px 16px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: ${s} !important;
      background-color: ${s} !important;
      color: ${m} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=d;let h=document.createElement("div");h.className="canopy-form-actions",h.appendChild(d),c.appendChild(h),this.container.appendChild(n),this.container.appendChild(c)}createField(e){let a=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field";let r=document.createElement("label");if(r.className="canopy-label",r.htmlFor=a,r.textContent=e.label||e.name,e.required){let o=document.createElement("span");o.className="canopy-required",o.textContent=" *",r.appendChild(o)}let n;switch(e.type){case"TEXTAREA":{let o=document.createElement("textarea");o.className="canopy-textarea";let s=L(e);if(s){let m=Math.min(Math.max(Math.ceil(s/60),4),15);o.rows=m}else o.rows=4;n=o;break}case"DROPDOWN":{let o=e.options,s=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o),m=s?o.options:Array.isArray(o)?o:[],b=s?o.defaultValue:void 0,g=s?o.allowOther:!1,h=document.createElement("select");if(h.className="canopy-select",m.forEach(p=>{let y=document.createElement("option");y.value=p.value,y.textContent=p.label,b&&p.value===b&&(y.selected=!0),h.appendChild(y)}),g){let p=document.createElement("option");p.value="__other__",p.textContent="Other",h.appendChild(p)}if(n=h,g){let p=document.createElement("input");p.type="text",p.className="canopy-input canopy-select-other",p.name=`${e.name}_other`,p.placeholder="Please specify...",p.style.setProperty("display","none","important"),p.style.marginTop="0.5rem",p.addEventListener("input",()=>{p.setCustomValidity("")}),h.addEventListener("change",()=>{h.value==="__other__"?(p.style.setProperty("display","block","important"),e.required&&(p.required=!0)):(p.style.setProperty("display","none","important"),p.required=!1,p.value="")}),h.__otherInput=p}break}case"CHECKBOX":{let o=document.createElement("label");o.className="canopy-checkbox";let s=document.createElement("input");s.type="checkbox",s.id=a,s.name=e.name,s.addEventListener("change",()=>{s.setCustomValidity("")}),o.appendChild(s);let m=document.createElement("span");if(m.textContent=e.label||e.name,o.appendChild(m),t.appendChild(o),e.helpText){let g=document.createElement("p");g.className="canopy-help-text",g.textContent=e.helpText,t.appendChild(g)}let b=document.createElement("span");return b.className="canopy-error",b.id=`${a}-error`,t.appendChild(b),s.setAttribute("aria-describedby",b.id),s.setAttribute("aria-invalid","false"),{wrapper:t,input:s,errorEl:b}}case"CHECKBOXES":{let o=e.options,m=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o)?o.options:Array.isArray(o)?o:[],b=document.createElement("div");b.className="canopy-checkboxes",b.setAttribute("data-checkbox-group",e.name),m.forEach(p=>{let y=document.createElement("label");y.className="canopy-checkbox";let v=document.createElement("input");v.type="checkbox",v.name=e.name,v.value=p.value,v.addEventListener("change",()=>{let u=b.querySelector("input[type=checkbox]");u&&u.setCustomValidity("")});let l=document.createElement("span");l.textContent=p.label,y.appendChild(v),y.appendChild(l),b.appendChild(y)});let g=document.createElement("input");if(g.type="hidden",g.id=a,g.name=e.name,t.appendChild(r),t.appendChild(b),e.helpText){let p=document.createElement("p");p.className="canopy-help-text",p.textContent=e.helpText,t.appendChild(p)}let h=document.createElement("span");return h.className="canopy-error",h.id=`${a}-error`,t.appendChild(h),g.setAttribute("aria-describedby",h.id),g.setAttribute("aria-invalid","false"),{wrapper:t,input:g,errorEl:h}}case"EMAIL":{let o=document.createElement("input");o.type="email",o.className="canopy-input",n=o;break}case"PHONE":{let o=document.createElement("input");o.type="tel",o.setAttribute("inputmode","tel"),o.setAttribute("autocomplete","tel"),o.className="canopy-input",n=o;break}case"DATE":{let o=document.createElement("input");o.type="date",o.className="canopy-input";let s=e.validation;s&&(s.minDate&&(o.min=this.resolveDate(s.minDate)),s.maxDate&&(o.max=this.resolveDate(s.maxDate))),n=o;break}case"NUMBER":{let o=document.createElement("input");o.type="number",o.className="canopy-input";let s=e.validation;s!=null&&s.integer?(o.setAttribute("inputmode","numeric"),o.setAttribute("step","1")):(o.setAttribute("inputmode","decimal"),o.setAttribute("step","any")),(s==null?void 0:s.min)!==void 0&&o.setAttribute("min",String(s.min)),(s==null?void 0:s.max)!==void 0&&o.setAttribute("max",String(s.max)),n=o;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);default:{let o=document.createElement("input");o.type="text",o.className="canopy-input",n=o}}n.id=a,n.name=e.name,n.setAttribute("aria-invalid","false"),e.placeholder&&n.setAttribute("placeholder",e.placeholder);let c=L(e);c&&(n instanceof HTMLInputElement||n instanceof HTMLTextAreaElement)&&(n.maxLength=c),n.addEventListener("input",()=>{n.setCustomValidity("")});let d=document.createElement("span");if(d.className="canopy-error",d.id=`${a}-error`,n.setAttribute("aria-describedby",d.id),t.appendChild(r),t.appendChild(n),n.__otherInput&&t.appendChild(n.__otherInput),e.helpText){let o=document.createElement("p");o.className="canopy-help-text",o.textContent=e.helpText,t.appendChild(o)}return t.appendChild(d),{wrapper:t,input:n,errorEl:d}}resolveDate(e){return e==="today"?new Date().toISOString().split("T")[0]:e}createNameField(e){let a=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-name-group";let r=document.createElement("label");r.className="canopy-label",r.textContent=e.label||e.name,t.appendChild(r);let n=e.options||{parts:["first","last"]},c=n.parts||["first","last"],d=n.partLabels||{},o=n.partsRequired||{},s={first:"First Name",last:"Last Name",middle:"Middle Name",middleInitial:"M.I.",single:"Full Name"},m=document.createElement("div");m.className="canopy-name-parts";let b=document.createElement("input");b.type="hidden",b.id=a,b.name=e.name;let g=document.createElement("span");if(g.className="canopy-error",g.id=`${a}-error`,c.forEach(h=>{let p=document.createElement("div");p.className="canopy-name-part";let y=document.createElement("label");y.className="canopy-name-part-label";let v=`${a}-${h}`;if(y.htmlFor=v,y.textContent=d[h]||s[h]||h,e.required||o[h]){let u=document.createElement("span");u.className="canopy-required",u.textContent=" *",y.appendChild(u)}let l=document.createElement("input");l.type="text",l.className="canopy-input",l.id=v,l.name=`${e.name}.${h}`,l.setAttribute("data-name-part",h),l.setAttribute("data-name-field",e.name),l.addEventListener("input",()=>{m.querySelectorAll("input[data-name-part]").forEach(u=>u.setCustomValidity(""))}),p.appendChild(y),p.appendChild(l),m.appendChild(p)}),t.appendChild(m),e.helpText){let h=document.createElement("p");h.className="canopy-help-text",h.textContent=e.helpText,t.appendChild(h)}return t.appendChild(g),{wrapper:t,input:b,errorEl:g}}createAddressField(e){let a=`${this.instanceId}-${e.name}`,t=e.options||{},r=document.createElement("div");r.className="canopy-field canopy-address-group";let n=document.createElement("label");n.className="canopy-label",n.textContent=e.label||"Address",r.appendChild(n);let c=document.createElement("div");c.className="canopy-address-parts";let d=document.createElement("input");d.type="hidden",d.id=a,d.name=e.name;let o=document.createElement("span");o.className="canopy-error",o.id=`${a}-error`;let s=[{key:"line1",label:"Street Address",tag:"input"}];if(t.showLine2!==!1&&s.push({key:"line2",label:"Apt, Suite, etc.",tag:"input"}),s.push({key:"city",label:"City",tag:"input"},{key:"region",label:"State",tag:"select"},{key:"postalCode",label:"ZIP Code",tag:"input",attrs:{maxlength:"10",inputmode:"numeric"}}),s.forEach(m=>{let b=document.createElement("div");b.className="canopy-address-part";let g=document.createElement("label");g.className="canopy-address-part-label";let h=`${a}-${m.key}`;if(g.htmlFor=h,g.textContent=m.label,e.required&&m.key!=="line2"){let y=document.createElement("span");y.className="canopy-required",y.textContent=" *",g.appendChild(y)}let p;if(m.tag==="select"){let y=document.createElement("select");y.className="canopy-select";let v=document.createElement("option");v.value="",v.textContent="Select...",y.appendChild(v),P.forEach(l=>{let u=document.createElement("option");u.value=l.value,u.textContent=l.label,y.appendChild(u)}),y.addEventListener("change",()=>{c.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(l=>l.setCustomValidity(""))}),p=y}else{let y=document.createElement("input");y.type="text",y.className="canopy-input",m.attrs&&Object.entries(m.attrs).forEach(([v,l])=>y.setAttribute(v,l)),y.addEventListener("input",()=>{c.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(v=>v.setCustomValidity(""))}),p=y}p.id=h,p.setAttribute("data-address-part",m.key),p.setAttribute("data-address-field",e.name),b.appendChild(g),b.appendChild(p),c.appendChild(b)}),r.appendChild(c),e.helpText){let m=document.createElement("p");m.className="canopy-help-text",m.textContent=e.helpText,r.appendChild(m)}return r.appendChild(o),{wrapper:r,input:d,errorEl:o}}collectValues(){let e={};return this.fieldElements.forEach((a,t)=>{if(a.input instanceof HTMLInputElement)if(a.input.type==="checkbox")e[t]=a.input.checked;else if(a.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${t}"]`);if(r){let n=[];r.querySelectorAll("input[type=checkbox]:checked").forEach(c=>{n.push(c.value)}),e[t]=n}else{let n=this.container.querySelectorAll(`input[data-name-field="${t}"]`);if(n.length>0){let c={};n.forEach(d=>{let o=d,s=o.getAttribute("data-name-part");s&&(c[s]=o.value)}),e[t]=c}else{let c=this.container.querySelectorAll(`input[data-address-field="${t}"], select[data-address-field="${t}"]`);if(c.length>0){let d={};c.forEach(o=>{let s=o.getAttribute("data-address-part");s&&(d[s]=o.value)}),e[t]=d}else e[t]=a.input.value}}}else e[t]=a.input.value;else a.input instanceof HTMLSelectElement&&a.input.value==="__other__"&&a.input.__otherInput?e[t]=a.input.__otherInput.value:e[t]=a.input.value}),e}findFailingInput(e){let a=this.container.querySelectorAll(`input[data-name-field="${e}"]`);if(a.length>0){for(let n of a)if(!n.value.trim())return n;return a[0]}let t=["line1","city","region","postalCode"],r=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(r.length>0){for(let n of r){let c=n.getAttribute("data-address-part");if(c&&t.includes(c)&&!n.value.trim())return n}for(let n of r)if(n.getAttribute("data-address-part")==="postalCode")return n;return r[0]}return null}showErrors(e){this.fieldElements.forEach((t,r)=>{let n=e[r]||"";if(t.input.type==="hidden"){let c=this.container.querySelector(`[data-checkbox-group="${r}"]`);if(c){let d=c.querySelector("input[type=checkbox]");d&&d.setCustomValidity(n)}else{let d=n?this.findFailingInput(r):null;d?d.setCustomValidity(n):this.container.querySelectorAll(`input[data-name-field="${r}"], input[data-address-field="${r}"], select[data-address-field="${r}"]`).forEach(s=>s.setCustomValidity(""))}}else t.input.setCustomValidity(n);t.errorEl.textContent=n,t.input.setAttribute("aria-invalid",n?"true":"false")});let a=Object.keys(e);if(a.length>0){let t=this.fieldElements.get(a[0]);if(t)if(t.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${a[0]}"]`);if(r){let n=r.querySelector("input[type=checkbox]");n&&(n.reportValidity(),n.focus())}else{let n=this.findFailingInput(a[0]);n&&(n.reportValidity(),n.focus())}}else t.input.reportValidity(),t.input.focus()}}setStatus(e,a){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${a}`)}async handleSubmit(e){var r,n,c;if(e.preventDefault(),!this.formDefinition)return;this.setStatus("","info"),this.fieldElements.forEach((d,o)=>{if(d.input.setCustomValidity(""),d.input.type==="hidden"){let s=this.container.querySelector(`[data-checkbox-group="${o}"]`);if(s){let m=s.querySelector("input[type=checkbox]");m&&m.setCustomValidity("")}else this.container.querySelectorAll(`input[data-name-field="${o}"], input[data-address-field="${o}"], select[data-address-field="${o}"]`).forEach(b=>b.setCustomValidity(""))}});let a=this.collectValues(),t=q(this.formDefinition.fields,a);if(this.showErrors(t),Object.keys(t).length>0){let d=Object.keys(t).length;this.setStatus(`Please fix ${d} field${d>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let d=this.options.baseUrl||"",o=this.options.formId||((r=this.formDefinition)==null?void 0:r.formId);if(!o){this.setStatus("Form configuration error.","error");return}let s=await fetch(`${d}/api/embed/${o}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)}),m=await s.json();if(!s.ok){m!=null&&m.fields&&this.showErrors(m.fields),this.setStatus((m==null?void 0:m.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}e.target.reset(),this.renderSuccess(this.formDefinition.successMessage||"Thanks for your submission!")}catch(d){console.error(d),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let d=((c=(n=this.formDefinition)==null?void 0:n.defaultTheme)==null?void 0:c.buttonText)||"Submit";this.submitButton.textContent=d,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderSuccess(e){this.statusEl&&(this.statusEl.textContent="",this.statusEl.className="canopy-status"),this.formEl&&(this.formEl.style.display="none");let a=this.container.querySelector(".canopy-success");a&&a.remove();let t=document.createElement("div");t.className="canopy-success",t.setAttribute("role","status"),t.setAttribute("aria-live","polite");let r=document.createElement("div");r.className="canopy-success-icon",r.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',t.appendChild(r);let n=document.createElement("p");n.className="canopy-success-message",n.textContent=e,t.appendChild(n);let c=document.createElement("button");c.type="button",c.className="canopy-success-reset",c.textContent="Submit another response",c.addEventListener("click",()=>{this.formDefinition&&this.render(this.formDefinition)}),t.appendChild(c),this.container.appendChild(t)}renderSkeleton(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-skeleton";let a=[{labelW:"30%",type:"input"},{labelW:"45%",type:"input"},{labelW:"25%",type:"textarea"}],t=0,r=document.createElement("div");r.className="canopy-skeleton-bar canopy-skeleton-title",r.style.animationDelay=`${t}s`,e.appendChild(r),t+=.15;let n=document.createElement("div");n.className="canopy-skeleton-bar canopy-skeleton-desc",n.style.animationDelay=`${t}s`,e.appendChild(n),t+=.15;for(let d of a){let o=document.createElement("div");o.className="canopy-skeleton-field";let s=document.createElement("div");s.className="canopy-skeleton-bar canopy-skeleton-label",s.style.width=d.labelW,s.style.animationDelay=`${t}s`,o.appendChild(s),t+=.1;let m=document.createElement("div");m.className=`canopy-skeleton-bar canopy-skeleton-${d.type}`,m.style.animationDelay=`${t}s`,o.appendChild(m),t+=.15,e.appendChild(o)}let c=document.createElement("div");c.className="canopy-skeleton-bar canopy-skeleton-button",c.style.animationDelay=`${t}s`,e.appendChild(c),this.container.appendChild(e)}renderError(e){this.container.innerHTML="";let a=document.createElement("div");a.className="canopy-status canopy-status-error",a.textContent=e,this.container.appendChild(a)}renderInactive(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let a=document.createElement("h2");a.className="canopy-inactive-heading",a.textContent="Form Not Available",e.appendChild(a);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is not currently accepting responses. Please contact the form owner if you believe this is an error.",e.appendChild(t),this.container.appendChild(e)}};var W=`
.canopy-root {
  font-family: var(--canopy-font, inherit);
  font-size: var(--canopy-font-size, 14px);
  color: var(--canopy-text, #18181b);
  background: var(--canopy-bg, #ffffff);
  padding: 4px;
  --canopy-heading-font: var(--canopy-font, inherit);
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
  font-family: var(--canopy-heading-font, var(--canopy-font, inherit));
  font-size: var(--canopy-label-size, 1.5em);
  font-weight: var(--canopy-title-weight, 400);
  color: var(--canopy-title-color, var(--canopy-text, #18181b));
  text-transform: var(--canopy-heading-transform, none);
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
  font-family: var(--canopy-heading-font, var(--canopy-font, inherit));
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--canopy-title-color, var(--canopy-text, #18181b));
}

.canopy-inactive-body {
  margin: 0;
  max-width: 360px;
  color: var(--canopy-muted-text, #71717a);
  font-size: var(--canopy-font-size, 14px);
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
  font-size: var(--canopy-font-size, 14px);
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
  font-size: calc(var(--canopy-font-size, 14px) - 1px);
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
  font-family: var(--canopy-heading-font, var(--canopy-font, inherit));
  font-size: var(--canopy-title-size, 1.5em);
  font-weight: var(--canopy-title-weight, 400);
  color: var(--canopy-title-color, var(--canopy-text, #18181b));
  text-transform: var(--canopy-heading-transform, none);
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
`;var V="canopy-embed-styles";function X(){if(document.getElementById(V))return;let i=document.createElement("style");i.id=V,i.textContent=W,document.head.appendChild(i)}function G(i){var e;return i.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function Y(i){let e=i.dataset.theme;if(e)try{return JSON.parse(e)}catch(a){console.warn("Canopy Forms: invalid data-theme JSON");return}}function F(){X(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let a=e.dataset.canopyForm;if(!a){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let t=Y(e),r=G(e);new w(e,{formId:a,themeOverrides:t,baseUrl:r}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",F):F();window.CanopyForms={init:F,CanopyForm:w};})();
