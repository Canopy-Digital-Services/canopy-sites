"use strict";(()=>{var E={fontSize:14,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:8,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:"md",titleWeight:"semibold",titleColor:void 0,labelWeight:"medium",labelTransform:"none",bodyFont:void 0,headingFont:void 0,fontUrl:void 0,fontFamily:void 0,buttonText:void 0},S=new Set;function C(s,e){if(!s)return e;let n=s.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:e:e}function F(s,e){return{...E,...s!=null?s:{},...e!=null?e:{}}}function P(s){let e=/^#?([0-9a-f]{6})$/i.exec(s.trim());if(!e)return null;let n=parseInt(e[1],16);return[n>>16&255,n>>8&255,n&255]}function z(s,e,n){let[t,r,a]=[s,e,n].map(u=>{let y=u/255;return y<=.03928?y/12.92:Math.pow((y+.055)/1.055,2.4)});return .2126*t+.7152*r+.0722*a}function V(s){try{let e=P(s);return e&&z(...e)>.179?"#18181b":"#ffffff"}catch(e){return"#ffffff"}}function $(s,e){var i,f,g,h,d;let n=N(e.bodyFont,e.fontFamily);s.style.setProperty("--canopy-font",n);let t=N(e.headingFont);s.style.setProperty("--canopy-heading-font",t==="inherit"?"var(--canopy-font)":t),s.style.setProperty("--canopy-font-size",`${(i=e.fontSize)!=null?i:E.fontSize}px`),s.style.setProperty("--canopy-text",C(e.text,E.text)),s.style.setProperty("--canopy-bg",C(e.background,E.background)),s.style.setProperty("--canopy-field-bg",C(e.fieldBackground,E.fieldBackground));let r=C(e.primary,E.primary);s.style.setProperty("--canopy-primary",r),s.style.setProperty("--canopy-button-text",V(r)),s.style.setProperty("--canopy-border",C(e.border,E.border)),s.style.setProperty("--canopy-radius",`${(f=e.radius)!=null?f:E.radius}px`),s.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),s.style.setProperty("--canopy-button-align",e.buttonAlign||E.buttonAlign);let a={sm:"1em",md:"1.25em",lg:"1.5em",xl:"1.875em"};s.style.setProperty("--canopy-title-size",a[(g=e.titleSize)!=null?g:"md"]);let u={normal:"400",semibold:"600",bold:"700"};s.style.setProperty("--canopy-title-weight",u[(h=e.titleWeight)!=null?h:"semibold"]);let y=e.titleColor?C(e.titleColor,""):"";y?s.style.setProperty("--canopy-title-color",y):s.style.removeProperty("--canopy-title-color");let o={normal:"400",medium:"500",semibold:"600"};s.style.setProperty("--canopy-label-weight",o[(d=e.labelWeight)!=null?d:"medium"]),s.style.setProperty("--canopy-label-transform",e.labelTransform==="uppercase"?"uppercase":"none")}function O(s){switch(s.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function N(s,e){return s&&s!=="inherit"?`'${s}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function D(s){let e=s.filter(a=>!!a&&a!=="inherit"&&!S.has(a));if(e.length===0)return;let t=`https://fonts.googleapis.com/css2?${e.map(a=>`family=${encodeURIComponent(a)}:wght@400;500;600;700`).join("&")}&display=swap`,r=document.createElement("link");r.rel="stylesheet",r.href=t,r.dataset.canopyFont="true",document.head.appendChild(r),e.forEach(a=>S.add(a))}function M(s){if(!s||S.has(s))return;let e=document.createElement("link");e.rel="stylesheet",e.href=s,e.dataset.canopyFont="true",document.head.appendChild(e),S.add(s)}var W={TEXT:200,EMAIL:254,TEXTAREA:2e3};function k(s){var e;return(e=s.validation)!=null&&e.maxLength?s.validation.maxLength:W[s.type]}function U(s){return s.label||s.name}function I(s,e){let n={};return s.forEach(t=>{var o,i,f,g,h,d,m;let r=e[t.name],a=U(t);if(t.required){if(t.type==="CHECKBOX"){if(!r){n[t.name]=`${a} is required.`;return}}else if(t.type==="CHECKBOXES"){if(!Array.isArray(r)||r.length===0){n[t.name]=`${a} is required.`;return}}else if(t.type!=="NAME"){if(t.type!=="ADDRESS"){if(r==null||String(r).trim()===""){n[t.name]=`${a} is required.`;return}}}}if(t.type==="CHECKBOXES"){if(Array.isArray(r)&&r.length>0){let l=t.options,p=l&&typeof l=="object"&&"options"in l?l.options.map(b=>b.value):[];for(let b of r)if(!p.includes(String(b))){n[t.name]=`${a} contains an invalid option.`;return}}return}if(!(t.type==="NAME"||t.type==="ADDRESS")){if(r==null||String(r).trim()==="")return}if(t.type==="EMAIL"){let l=String(r);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(l)){n[t.name]="Enter a valid email address";return}let p=(o=t.validation)==null?void 0:o.domainRules;if(p){let b=(i=l.split("@")[1])==null?void 0:i.toLowerCase();if(p.allow&&p.allow.length>0&&!p.allow.map(v=>v.toLowerCase()).includes(b)){n[t.name]=`${a} must be from an allowed domain.`;return}if(p.block&&p.block.length>0&&p.block.map(v=>v.toLowerCase()).includes(b)){n[t.name]=`${a} domain is not allowed.`;return}}}if(t.type==="PHONE"){let l=String(r),c=((f=t.validation)==null?void 0:f.format)||"lenient";if(c==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(l)){n[t.name]=`${a} must be a valid phone number.`;return}}else if(c==="strict"){let p=l.replace(/[^\d+]/g,"");if(p.startsWith("+1"))p=p.substring(2);else if(p.startsWith("+")){n[t.name]=`${a} must be a valid US phone number (10 digits).`;return}else p.startsWith("1")&&p.length===11&&(p=p.substring(1));if(!/^\d{10}$/.test(p)){n[t.name]=`${a} must be a valid US phone number (10 digits).`;return}}return}if(t.type==="DATE"){let l=String(r),c=new Date(l);if(isNaN(c.getTime())){n[t.name]=`${a} must be a valid date.`;return}let p=new Date;p.setHours(0,0,0,0),c.setHours(0,0,0,0);let b=t.validation;if(b!=null&&b.noFuture&&c>p){n[t.name]=`${a} cannot be a future date.`;return}if(b!=null&&b.noPast&&c<p){n[t.name]=`${a} cannot be a past date.`;return}if(b!=null&&b.minDate){let x=new Date(b.minDate==="today"?p:b.minDate);if(x.setHours(0,0,0,0),c<x){n[t.name]=`${a} must be on or after ${x.toLocaleDateString()}.`;return}}if(b!=null&&b.maxDate){let x=new Date(b.maxDate==="today"?p:b.maxDate);if(x.setHours(0,0,0,0),c>x){n[t.name]=`${a} must be on or before ${x.toLocaleDateString()}.`;return}}}if(t.type==="NUMBER"){let l=Number(r);if(isNaN(l)){n[t.name]=`${a} must be a number.`;return}let c=t.validation;if(c!=null&&c.integer&&!Number.isInteger(l)){n[t.name]=`${a} must be a whole number.`;return}if((c==null?void 0:c.min)!==void 0&&l<c.min){n[t.name]=`${a} must be at least ${c.min}.`;return}if((c==null?void 0:c.max)!==void 0&&l>c.max){n[t.name]=`${a} must be at most ${c.max}.`;return}return}if(t.type==="NAME"){let l=r,c=t.options||{parts:["first","last"]},p=c.parts||["first","last"],b=c.partsRequired||{};for(let x of p){let v=l[x];if((t.required||b[x])&&(!v||v.trim()==="")){let A=((g=c.partLabels)==null?void 0:g[x])||x;n[t.name]=`${A} is required.`;return}}return}if(t.type==="ADDRESS"){let l=r,c=t.options||{},p=["line1","city","region","postalCode"];if(!(c.showLine2!==!1?["line1","line2","city","region","postalCode"]:p).some(T=>{var A;return(A=l==null?void 0:l[T])==null?void 0:A.trim()})&&!t.required)return;let v={line1:"Street address",city:"City",region:"State",postalCode:"ZIP code"};for(let T of p)if(!((h=l==null?void 0:l[T])!=null&&h.trim())){n[t.name]=`${v[T]} is required.`;return}return}if(t.type==="DROPDOWN"&&Array.isArray(t.options)&&!t.options.map(c=>c.value).includes(String(r))){n[t.name]=`${a} must be a valid option.`;return}let u=String(r),y=k(t);if((d=t.validation)!=null&&d.minLength&&u.length<t.validation.minLength){n[t.name]=`${a} must be at least ${t.validation.minLength} characters.`;return}if(y&&u.length>y){n[t.name]=`${a} must be at most ${y} characters.`;return}if(t.type==="TEXT"||t.type==="TEXTAREA"){let l=(m=t.validation)==null?void 0:m.format;if(l&&l!=="alphanumeric"){let c=!0,p=`${a} is invalid.`;switch(l){case"numbers":c=/^\d+$/.test(u),p=`${a} must contain only numbers.`;break;case"letters":c=/^[A-Za-z]+$/.test(u),p=`${a} must contain only letters.`;break;case"url":{let b=u.startsWith("http")?u:`https://${u}`;try{c=new URL(b).hostname.includes(".")}catch(x){c=!1}p=`${a} must be a valid URL.`;break}case"postal-us":c=/^\d{5}(-\d{4})?$/.test(u),p=`${a} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":c=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(u),p=`${a} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}c||(n[t.name]=p)}}}),n}var H=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var _=0,w=class{constructor(e,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.submitButton=null;this.instanceId=`canopy-${_++}`;this.container=e,this.options=n}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){console.error(e),this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){let e=this.options.baseUrl||"",n=await fetch(`${e}/api/embed/${this.options.formId}`,{method:"GET",credentials:"omit"});if(!n.ok)throw new Error("Failed to load form definition");return n.json()}render(e){this.container.innerHTML="",this.fieldElements.clear();let n=F(e.defaultTheme,this.options.themeOverrides);if($(this.container,n),D([n.bodyFont,n.headingFont]),!n.bodyFont&&!n.headingFont&&M(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(O(n)),!e.fields||e.fields.length===0){this.renderError("This form is not configured yet.");return}if(e.title||e.description){let h=document.createElement("div");if(h.className="canopy-header",e.title){let d=document.createElement("h2");d.className="canopy-title",d.textContent=e.title,h.appendChild(d)}if(e.description){let d=document.createElement("p");d.className="canopy-description",d.textContent=e.description,h.appendChild(d)}this.container.appendChild(h)}let t=document.createElement("div");t.className="canopy-status",t.setAttribute("role","status"),this.statusEl=t;let r=document.createElement("form");r.className="canopy-form",r.addEventListener("submit",h=>this.handleSubmit(h)),e.fields.forEach(h=>{let{wrapper:d,input:m,errorEl:l}=this.createField(h);d&&r.appendChild(d),this.fieldElements.set(h.name,{input:m,errorEl:l})});let a=document.createElement("button");a.type="submit",a.className="canopy-submit",a.textContent=n.buttonText||"Submit";let u=getComputedStyle(this.container),y=u.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",o=u.getPropertyValue("--canopy-button-text").trim()||"#ffffff",i=u.getPropertyValue("--canopy-radius").trim()||"8px",f=u.getPropertyValue("--canopy-button-width").trim()||"100%";a.style.cssText=`
      display: block !important;
      width: ${f} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${i} !important;
      padding: 10px 16px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: ${y} !important;
      background-color: ${y} !important;
      color: ${o} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=a;let g=document.createElement("div");g.className="canopy-form-actions",g.appendChild(a),r.appendChild(g),this.container.appendChild(t),this.container.appendChild(r)}createField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field";let r=document.createElement("label");if(r.className="canopy-label",r.htmlFor=n,r.textContent=e.label||e.name,e.required){let o=document.createElement("span");o.className="canopy-required",o.textContent=" *",r.appendChild(o)}let a;switch(e.type){case"TEXTAREA":{let o=document.createElement("textarea");o.className="canopy-textarea";let i=k(e);if(i){let f=Math.min(Math.max(Math.ceil(i/60),4),15);o.rows=f}else o.rows=4;a=o;break}case"DROPDOWN":{let o=e.options,i=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o),f=i?o.options:Array.isArray(o)?o:[],g=i?o.defaultValue:void 0,h=i?o.allowOther:!1,d=document.createElement("select");if(d.className="canopy-select",f.forEach(m=>{let l=document.createElement("option");l.value=m.value,l.textContent=m.label,g&&m.value===g&&(l.selected=!0),d.appendChild(l)}),h){let m=document.createElement("option");m.value="__other__",m.textContent="Other",d.appendChild(m)}if(a=d,h){let m=document.createElement("input");m.type="text",m.className="canopy-input canopy-select-other",m.name=`${e.name}_other`,m.placeholder="Please specify...",m.style.setProperty("display","none","important"),m.style.marginTop="0.5rem",m.addEventListener("input",()=>{m.setCustomValidity("")}),d.addEventListener("change",()=>{d.value==="__other__"?(m.style.setProperty("display","block","important"),e.required&&(m.required=!0)):(m.style.setProperty("display","none","important"),m.required=!1,m.value="")}),d.__otherInput=m}break}case"CHECKBOX":{let o=document.createElement("label");o.className="canopy-checkbox";let i=document.createElement("input");i.type="checkbox",i.id=n,i.name=e.name,i.addEventListener("change",()=>{i.setCustomValidity("")}),o.appendChild(i);let f=document.createElement("span");if(f.textContent=e.label||e.name,o.appendChild(f),t.appendChild(o),e.helpText){let h=document.createElement("p");h.className="canopy-help-text",h.textContent=e.helpText,t.appendChild(h)}let g=document.createElement("span");return g.className="canopy-error",g.id=`${n}-error`,t.appendChild(g),i.setAttribute("aria-describedby",g.id),i.setAttribute("aria-invalid","false"),{wrapper:t,input:i,errorEl:g}}case"CHECKBOXES":{let o=e.options,f=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o)?o.options:Array.isArray(o)?o:[],g=document.createElement("div");g.className="canopy-checkboxes",g.setAttribute("data-checkbox-group",e.name),f.forEach(m=>{let l=document.createElement("label");l.className="canopy-checkbox";let c=document.createElement("input");c.type="checkbox",c.name=e.name,c.value=m.value,c.addEventListener("change",()=>{let b=g.querySelector("input[type=checkbox]");b&&b.setCustomValidity("")});let p=document.createElement("span");p.textContent=m.label,l.appendChild(c),l.appendChild(p),g.appendChild(l)});let h=document.createElement("input");if(h.type="hidden",h.id=n,h.name=e.name,t.appendChild(r),t.appendChild(g),e.helpText){let m=document.createElement("p");m.className="canopy-help-text",m.textContent=e.helpText,t.appendChild(m)}let d=document.createElement("span");return d.className="canopy-error",d.id=`${n}-error`,t.appendChild(d),h.setAttribute("aria-describedby",d.id),h.setAttribute("aria-invalid","false"),{wrapper:t,input:h,errorEl:d}}case"EMAIL":{let o=document.createElement("input");o.type="email",o.className="canopy-input",a=o;break}case"PHONE":{let o=document.createElement("input");o.type="tel",o.setAttribute("inputmode","tel"),o.setAttribute("autocomplete","tel"),o.className="canopy-input",a=o;break}case"DATE":{let o=document.createElement("input");o.type="date",o.className="canopy-input";let i=e.validation;i&&(i.minDate&&(o.min=this.resolveDate(i.minDate)),i.maxDate&&(o.max=this.resolveDate(i.maxDate)),i.noFuture&&(o.max=new Date().toISOString().split("T")[0]),i.noPast&&(o.min=new Date().toISOString().split("T")[0])),a=o;break}case"NUMBER":{let o=document.createElement("input");o.type="number",o.className="canopy-input";let i=e.validation;i!=null&&i.integer?(o.setAttribute("inputmode","numeric"),o.setAttribute("step","1")):(o.setAttribute("inputmode","decimal"),o.setAttribute("step","any")),(i==null?void 0:i.min)!==void 0&&o.setAttribute("min",String(i.min)),(i==null?void 0:i.max)!==void 0&&o.setAttribute("max",String(i.max)),a=o;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);default:{let o=document.createElement("input");o.type="text",o.className="canopy-input",a=o}}a.id=n,a.name=e.name,a.setAttribute("aria-invalid","false"),e.placeholder&&a.setAttribute("placeholder",e.placeholder);let u=k(e);u&&(a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement)&&(a.maxLength=u),a.addEventListener("input",()=>{a.setCustomValidity("")});let y=document.createElement("span");if(y.className="canopy-error",y.id=`${n}-error`,a.setAttribute("aria-describedby",y.id),t.appendChild(r),t.appendChild(a),a.__otherInput&&t.appendChild(a.__otherInput),e.helpText){let o=document.createElement("p");o.className="canopy-help-text",o.textContent=e.helpText,t.appendChild(o)}return t.appendChild(y),{wrapper:t,input:a,errorEl:y}}resolveDate(e){return e==="today"?new Date().toISOString().split("T")[0]:e}createNameField(e){let n=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-name-group";let r=document.createElement("label");if(r.className="canopy-label",r.textContent=e.label||e.name,e.required){let d=document.createElement("span");d.className="canopy-required",d.textContent=" *",r.appendChild(d)}t.appendChild(r);let a=e.options||{parts:["first","last"]},u=a.parts||["first","last"],y=a.partLabels||{},o=a.partsRequired||{},i={first:"First Name",last:"Last Name",middle:"Middle Name",middleInitial:"M.I.",single:"Full Name"},f=document.createElement("div");f.className="canopy-name-parts";let g=document.createElement("input");g.type="hidden",g.id=n,g.name=e.name;let h=document.createElement("span");if(h.className="canopy-error",h.id=`${n}-error`,u.forEach(d=>{let m=document.createElement("div");m.className="canopy-name-part";let l=document.createElement("label");l.className="canopy-name-part-label";let c=`${n}-${d}`;if(l.htmlFor=c,l.textContent=y[d]||i[d]||d,e.required||o[d]){let b=document.createElement("span");b.className="canopy-required",b.textContent=" *",l.appendChild(b)}let p=document.createElement("input");p.type="text",p.className="canopy-input",p.id=c,p.name=`${e.name}.${d}`,p.setAttribute("data-name-part",d),p.setAttribute("data-name-field",e.name),p.addEventListener("input",()=>{p.setCustomValidity("")}),m.appendChild(l),m.appendChild(p),f.appendChild(m)}),t.appendChild(f),e.helpText){let d=document.createElement("p");d.className="canopy-help-text",d.textContent=e.helpText,t.appendChild(d)}return t.appendChild(h),{wrapper:t,input:g,errorEl:h}}createAddressField(e){let n=`${this.instanceId}-${e.name}`,t=e.options||{},r=document.createElement("div");r.className="canopy-field canopy-address-group";let a=document.createElement("label");if(a.className="canopy-label",a.textContent=e.label||"Address",e.required){let f=document.createElement("span");f.className="canopy-required",f.textContent=" *",a.appendChild(f)}r.appendChild(a);let u=document.createElement("div");u.className="canopy-address-parts";let y=document.createElement("input");y.type="hidden",y.id=n,y.name=e.name;let o=document.createElement("span");o.className="canopy-error",o.id=`${n}-error`;let i=[{key:"line1",label:"Street Address",tag:"input"}];if(t.showLine2!==!1&&i.push({key:"line2",label:"Apt, Suite, etc.",tag:"input"}),i.push({key:"city",label:"City",tag:"input"},{key:"region",label:"State",tag:"select"},{key:"postalCode",label:"ZIP Code",tag:"input",attrs:{maxlength:"10",inputmode:"numeric"}}),i.forEach(f=>{let g=document.createElement("div");g.className="canopy-address-part";let h=document.createElement("label");h.className="canopy-address-part-label";let d=`${n}-${f.key}`;h.htmlFor=d,h.textContent=f.label;let m;if(f.tag==="select"){let l=document.createElement("select");l.className="canopy-select";let c=document.createElement("option");c.value="",c.textContent="Select...",l.appendChild(c),H.forEach(p=>{let b=document.createElement("option");b.value=p.value,b.textContent=p.label,l.appendChild(b)}),l.addEventListener("change",()=>{l.setCustomValidity("")}),m=l}else{let l=document.createElement("input");l.type="text",l.className="canopy-input",f.attrs&&Object.entries(f.attrs).forEach(([c,p])=>l.setAttribute(c,p)),l.addEventListener("input",()=>{l.setCustomValidity("")}),m=l}m.id=d,m.setAttribute("data-address-part",f.key),m.setAttribute("data-address-field",e.name),g.appendChild(h),g.appendChild(m),u.appendChild(g)}),r.appendChild(u),e.helpText){let f=document.createElement("p");f.className="canopy-help-text",f.textContent=e.helpText,r.appendChild(f)}return r.appendChild(o),{wrapper:r,input:y,errorEl:o}}collectValues(){let e={};return this.fieldElements.forEach((n,t)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")e[t]=n.input.checked;else if(n.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${t}"]`);if(r){let a=[];r.querySelectorAll("input[type=checkbox]:checked").forEach(u=>{a.push(u.value)}),e[t]=a}else{let a=this.container.querySelectorAll(`input[data-name-field="${t}"]`);if(a.length>0){let u={};a.forEach(y=>{let o=y,i=o.getAttribute("data-name-part");i&&(u[i]=o.value)}),e[t]=u}else{let u=this.container.querySelectorAll(`input[data-address-field="${t}"], select[data-address-field="${t}"]`);if(u.length>0){let y={};u.forEach(o=>{let i=o.getAttribute("data-address-part");i&&(y[i]=o.value)}),e[t]=y}else e[t]=n.input.value}}}else e[t]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value==="__other__"&&n.input.__otherInput?e[t]=n.input.__otherInput.value:e[t]=n.input.value}),e}showErrors(e){this.fieldElements.forEach((t,r)=>{let a=e[r]||"";if(t.input.type==="hidden"){let u=this.container.querySelector(`[data-checkbox-group="${r}"]`);if(u){let y=u.querySelector("input[type=checkbox]");y&&y.setCustomValidity(a)}else{let y=this.container.querySelector(`input[data-name-field="${r}"]`);if(y)y.setCustomValidity(a);else{let o=this.container.querySelector(`input[data-address-field="${r}"], select[data-address-field="${r}"]`);o&&o.setCustomValidity(a)}}}else t.input.setCustomValidity(a);t.errorEl.textContent=a,t.input.setAttribute("aria-invalid",a?"true":"false")});let n=Object.keys(e);if(n.length>0){let t=this.fieldElements.get(n[0]);if(t)if(t.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${n[0]}"]`);if(r){let a=r.querySelector("input[type=checkbox]");a&&(a.reportValidity(),a.focus())}else{let a=this.container.querySelector(`input[data-name-field="${n[0]}"]`);if(a)a.reportValidity(),a.focus();else{let u=this.container.querySelector(`input[data-address-field="${n[0]}"], select[data-address-field="${n[0]}"]`);u&&(u.reportValidity(),u.focus())}}}else t.input.reportValidity(),t.input.focus()}}setStatus(e,n){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(e){var r,a;if(e.preventDefault(),!this.formDefinition)return;this.setStatus("","info"),this.fieldElements.forEach((u,y)=>{if(u.input.setCustomValidity(""),u.input.type==="hidden"){let o=this.container.querySelector(`[data-checkbox-group="${y}"]`);if(o){let i=o.querySelector("input[type=checkbox]");i&&i.setCustomValidity("")}else{let i=this.container.querySelector(`input[data-name-field="${y}"]`);if(i)i.setCustomValidity("");else{let f=this.container.querySelector(`input[data-address-field="${y}"], select[data-address-field="${y}"]`);f&&f.setCustomValidity("")}}}});let n=this.collectValues(),t=I(this.formDefinition.fields,n);if(this.showErrors(t),Object.keys(t).length>0){let u=Object.keys(t).length;this.setStatus(`Please fix ${u} field${u>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let u=this.options.baseUrl||"",y=await fetch(`${u}/api/embed/${this.options.formId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),o=await y.json();if(!y.ok){o!=null&&o.fields&&this.showErrors(o.fields),this.setStatus((o==null?void 0:o.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}this.setStatus(this.formDefinition.successMessage||"Thanks for your submission!","success"),e.target.reset()}catch(u){console.error(u),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let u=((a=(r=this.formDefinition)==null?void 0:r.defaultTheme)==null?void 0:a.buttonText)||"Submit";this.submitButton.textContent=u,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderError(e){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=e,this.container.appendChild(n)}};var R=`
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
`;var q="canopy-embed-styles";function B(){if(document.getElementById(q))return;let s=document.createElement("style");s.id=q,s.textContent=R,document.head.appendChild(s)}function K(s){var e;return s.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function Z(s){let e=s.dataset.theme;if(e)try{return JSON.parse(e)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function L(){B(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=e.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let t=Z(e),r=K(e);new w(e,{formId:n,themeOverrides:t,baseUrl:r}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",L):L();window.CanopyForms={init:L};})();
