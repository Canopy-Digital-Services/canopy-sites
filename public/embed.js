"use strict";(()=>{var v={fontSize:14,text:"#18181b",background:"#ffffff",fieldBackground:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:4,density:"normal",buttonWidth:"full",buttonAlign:"left",titleSize:"md",titleWeight:"normal",labelSize:"md",labelWeight:"medium",labelTransform:"none"},w=new Set;function C(l,e){if(!l)return e;let a=l.trim();return a?/^var\(/i.test(a)||/^rgb/i.test(a)||/^hsl/i.test(a)||/^color\(/i.test(a)||/^(transparent|currentcolor|inherit)$/i.test(a)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(a)?a:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(a)?`#${a}`:e:e}function $(l,e){return{...v,...l!=null?l:{},...e!=null?e:{}}}function q(l){let e=/^#?([0-9a-f]{6})$/i.exec(l.trim());if(!e)return null;let a=parseInt(e[1],16);return[a>>16&255,a>>8&255,a&255]}function V(l,e,a){let[t,r,n]=[l,e,a].map(p=>{let m=p/255;return m<=.03928?m/12.92:Math.pow((m+.055)/1.055,2.4)});return .2126*t+.7152*r+.0722*n}function W(l){try{let e=q(l);return e&&V(...e)>.179?"#18181b":"#ffffff"}catch(e){return"#ffffff"}}function D(l,e){var i,y,b,g,f,u;let a=F(e.bodyFont,e.fontFamily);l.style.setProperty("--canopy-font",a);let t=F(e.headingFont);l.style.setProperty("--canopy-heading-font",t==="inherit"?"var(--canopy-font)":t),l.style.setProperty("--canopy-font-size",`${(i=e.fontSize)!=null?i:v.fontSize}px`),l.style.setProperty("--canopy-text",C(e.text,v.text)),l.style.setProperty("--canopy-bg",C(e.background,v.background)),l.style.setProperty("--canopy-field-bg",C(e.fieldBackground,v.fieldBackground));let r=C(e.primary,v.primary);l.style.setProperty("--canopy-primary",r),l.style.setProperty("--canopy-button-text",W(r)),l.style.setProperty("--canopy-border",C(e.border,v.border)),l.style.setProperty("--canopy-radius",`${(y=e.radius)!=null?y:v.radius}px`),l.style.setProperty("--canopy-button-width",e.buttonWidth==="auto"?"auto":"100%"),l.style.setProperty("--canopy-button-align",e.buttonAlign||v.buttonAlign);let n={sm:"1.25em",md:"1.5em",lg:"1.875em",xl:"2.25em"};l.style.setProperty("--canopy-title-size",n[(b=e.titleSize)!=null?b:"md"]),l.style.setProperty("--canopy-label-size",n[(g=e.labelSize)!=null?g:"md"]);let p={light:"300",normal:"400",bold:"700",semibold:"700"},m=(f=e.titleWeight)!=null?f:"normal";l.style.setProperty("--canopy-title-weight",(u=p[m])!=null?u:"400");let o=e.titleColor?C(e.titleColor,""):"";o?l.style.setProperty("--canopy-title-color",o):l.style.removeProperty("--canopy-title-color"),l.style.setProperty("--canopy-heading-transform",e.labelTransform==="uppercase"?"uppercase":"none")}function M(l){switch(l.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function F(l,e){return l&&l!=="inherit"?`'${l}', sans-serif`:e&&e!=="inherit"?e:"inherit"}function I(l){let e=l.filter(n=>!!n&&n!=="inherit"&&!w.has(n));if(e.length===0)return;let t=`https://fonts.googleapis.com/css2?${e.map(n=>`family=${encodeURIComponent(n)}:wght@300;400;700`).join("&")}&display=swap`,r=document.createElement("link");r.rel="stylesheet",r.href=t,r.dataset.canopyFont="true",document.head.appendChild(r),e.forEach(n=>w.add(n))}function O(l){if(!l||w.has(l))return;let e=document.createElement("link");e.rel="stylesheet",e.href=l,e.dataset.canopyFont="true",document.head.appendChild(e),w.add(l)}var B={TEXT:200,EMAIL:254,TEXTAREA:2e3};function L(l){var e;return(e=l.validation)!=null&&e.maxLength?l.validation.maxLength:B[l.type]}function _(l){return l.label||l.name}function H(l,e){let a={};return l.forEach(t=>{var o,i,y,b,g,f,u;let r=e[t.name],n=_(t);if(t.required){if(t.type==="CHECKBOX"){if(!r){a[t.name]=`${n} is required.`;return}}else if(t.type==="CHECKBOXES"){if(!Array.isArray(r)||r.length===0){a[t.name]=`${n} is required.`;return}}else if(t.type!=="NAME"){if(t.type!=="ADDRESS"){if(r==null||String(r).trim()===""){a[t.name]=`${n} is required.`;return}}}}if(t.type==="CHECKBOXES"){if(Array.isArray(r)&&r.length>0){let s=t.options,d=s&&typeof s=="object"&&"options"in s?s.options.map(h=>h.value):[];for(let h of r)if(!d.includes(String(h))){a[t.name]=`${n} contains an invalid option.`;return}}return}if(!(t.type==="NAME"||t.type==="ADDRESS")){if(r==null||String(r).trim()==="")return}if(t.type==="EMAIL"){let s=String(r);if(!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(s)){a[t.name]="Enter a valid email address";return}let d=(o=t.validation)==null?void 0:o.domainRules;if(d){let h=(i=s.split("@")[1])==null?void 0:i.toLowerCase();if(d.allow&&d.allow.length>0&&!d.allow.map(E=>E.toLowerCase()).includes(h)){a[t.name]=`${n} must be from an allowed domain.`;return}if(d.block&&d.block.length>0&&d.block.map(E=>E.toLowerCase()).includes(h)){a[t.name]=`${n} domain is not allowed.`;return}}}if(t.type==="PHONE"){let s=String(r),c=((y=t.validation)==null?void 0:y.format)||"lenient";if(c==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(s)){a[t.name]=`${n} must be a valid phone number.`;return}}else if(c==="strict"){let d=s.replace(/[^\d+]/g,"");if(d.startsWith("+1"))d=d.substring(2);else if(d.startsWith("+")){a[t.name]=`${n} must be a valid US phone number (10 digits).`;return}else d.startsWith("1")&&d.length===11&&(d=d.substring(1));if(!/^\d{10}$/.test(d)){a[t.name]=`${n} must be a valid US phone number (10 digits).`;return}}return}if(t.type==="DATE"){let s=String(r),c=new Date(s);if(isNaN(c.getTime())){a[t.name]=`${n} must be a valid date.`;return}let d=new Date;d.setHours(0,0,0,0),c.setHours(0,0,0,0);let h=t.validation;if(h!=null&&h.noFuture&&c>d){a[t.name]=`${n} cannot be a future date.`;return}if(h!=null&&h.noPast&&c<d){a[t.name]=`${n} cannot be a past date.`;return}if(h!=null&&h.minDate){let x=new Date(h.minDate==="today"?d:h.minDate);if(x.setHours(0,0,0,0),c<x){a[t.name]=`${n} must be on or after ${x.toLocaleDateString()}.`;return}}if(h!=null&&h.maxDate){let x=new Date(h.maxDate==="today"?d:h.maxDate);if(x.setHours(0,0,0,0),c>x){a[t.name]=`${n} must be on or before ${x.toLocaleDateString()}.`;return}}}if(t.type==="NUMBER"){let s=Number(r);if(isNaN(s)){a[t.name]=`${n} must be a number.`;return}let c=t.validation;if(c!=null&&c.integer&&!Number.isInteger(s)){a[t.name]=`${n} must be a whole number.`;return}if((c==null?void 0:c.min)!==void 0&&s<c.min){a[t.name]=`${n} must be at least ${c.min}.`;return}if((c==null?void 0:c.max)!==void 0&&s>c.max){a[t.name]=`${n} must be at most ${c.max}.`;return}return}if(t.type==="NAME"){let s=r,c=t.options||{parts:["first","last"]},d=c.parts||["first","last"],h=c.partsRequired||{};for(let x of d){let E=s[x];if((t.required||h[x])&&(!E||E.trim()==="")){let S=((b=c.partLabels)==null?void 0:b[x])||x;a[t.name]=`${S} is required.`;return}}return}if(t.type==="ADDRESS"){let s=r,c=t.options||{},d=["line1","city","region","postalCode"];if(!(c.showLine2!==!1?["line1","line2","city","region","postalCode"]:d).some(k=>{var S;return(S=s==null?void 0:s[k])==null?void 0:S.trim()})&&!t.required)return;let E={line1:"Street address",city:"City",region:"State",postalCode:"ZIP code"};for(let k of d)if(!((g=s==null?void 0:s[k])!=null&&g.trim())){a[t.name]=`${E[k]} is required.`;return}return}if(t.type==="DROPDOWN"&&Array.isArray(t.options)&&!t.options.map(c=>c.value).includes(String(r))){a[t.name]=`${n} must be a valid option.`;return}let p=String(r),m=L(t);if((f=t.validation)!=null&&f.minLength&&p.length<t.validation.minLength){a[t.name]=`${n} must be at least ${t.validation.minLength} characters.`;return}if(m&&p.length>m){a[t.name]=`${n} must be at most ${m} characters.`;return}if(t.type==="TEXT"||t.type==="TEXTAREA"){let s=(u=t.validation)==null?void 0:u.format;if(s&&s!=="alphanumeric"){let c=!0,d=`${n} is invalid.`;switch(s){case"numbers":c=/^\d+$/.test(p),d=`${n} must contain only numbers.`;break;case"letters":c=/^[A-Za-z]+$/.test(p),d=`${n} must contain only letters.`;break;case"url":{let h=p.startsWith("http")?p:`https://${p}`;try{c=new URL(h).hostname.includes(".")}catch(x){c=!1}d=`${n} must be a valid URL.`;break}case"postal-us":c=/^\d{5}(-\d{4})?$/.test(p),d=`${n} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":c=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(p),d=`${n} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}c||(a[t.name]=d)}}}),a}var z=[{value:"AL",label:"Alabama"},{value:"AK",label:"Alaska"},{value:"AS",label:"American Samoa"},{value:"AZ",label:"Arizona"},{value:"AR",label:"Arkansas"},{value:"CA",label:"California"},{value:"CO",label:"Colorado"},{value:"CT",label:"Connecticut"},{value:"DE",label:"Delaware"},{value:"DC",label:"District of Columbia"},{value:"FL",label:"Florida"},{value:"GA",label:"Georgia"},{value:"GU",label:"Guam"},{value:"HI",label:"Hawaii"},{value:"ID",label:"Idaho"},{value:"IL",label:"Illinois"},{value:"IN",label:"Indiana"},{value:"IA",label:"Iowa"},{value:"KS",label:"Kansas"},{value:"KY",label:"Kentucky"},{value:"LA",label:"Louisiana"},{value:"ME",label:"Maine"},{value:"MD",label:"Maryland"},{value:"MA",label:"Massachusetts"},{value:"MI",label:"Michigan"},{value:"MN",label:"Minnesota"},{value:"MS",label:"Mississippi"},{value:"MO",label:"Missouri"},{value:"MT",label:"Montana"},{value:"NE",label:"Nebraska"},{value:"NV",label:"Nevada"},{value:"NH",label:"New Hampshire"},{value:"NJ",label:"New Jersey"},{value:"NM",label:"New Mexico"},{value:"NY",label:"New York"},{value:"NC",label:"North Carolina"},{value:"ND",label:"North Dakota"},{value:"MP",label:"Northern Mariana Islands"},{value:"OH",label:"Ohio"},{value:"OK",label:"Oklahoma"},{value:"OR",label:"Oregon"},{value:"PA",label:"Pennsylvania"},{value:"PR",label:"Puerto Rico"},{value:"RI",label:"Rhode Island"},{value:"SC",label:"South Carolina"},{value:"SD",label:"South Dakota"},{value:"TN",label:"Tennessee"},{value:"TX",label:"Texas"},{value:"UT",label:"Utah"},{value:"VT",label:"Vermont"},{value:"VI",label:"U.S. Virgin Islands"},{value:"VA",label:"Virginia"},{value:"WA",label:"Washington"},{value:"WV",label:"West Virginia"},{value:"WI",label:"Wisconsin"},{value:"WY",label:"Wyoming"}];var U=0,T=class extends Error{constructor(e){super(e),this.name="InactiveFormError"}},A=class{constructor(e,a){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.formEl=null;this.submitButton=null;this.instanceId=`canopy-${U++}`;this.container=e,this.options=a}async init(){try{this.container.classList.add("canopy-root");let e=await this.fetchDefinition();this.formDefinition=e,this.render(e)}catch(e){if(console.error(e),e instanceof T){this.renderInactive();return}this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){var r;let e=this.options.baseUrl||"",a=this.options.formId||((r=this.formDefinition)==null?void 0:r.formId);if(!a)throw new Error("Form configuration error: no formId");let t=await fetch(`${e}/api/embed/${a}`,{method:"GET",credentials:"omit"});if(!t.ok){if(t.status===403)try{let n=await t.json();if((n==null?void 0:n.code)==="FORM_INACTIVE")throw new T(n.error||"Form is inactive")}catch(n){if(n instanceof T)throw n}throw new Error("Failed to load form definition")}return t.json()}renderFromDefinition(e){this.container.classList.add("canopy-root"),this.formDefinition=e,this.render(e)}render(e){this.container.innerHTML="",this.fieldElements.clear();let a=$(e.defaultTheme,this.options.themeOverrides);D(this.container,a),I([a.bodyFont,a.headingFont]),!a.bodyFont&&!a.headingFont&&O(a.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(M(a));let t=e.fields&&e.fields.length>0,r=e.title||e.description;if(!t&&!r){this.renderSkeleton();return}if(e.title||e.description){let u=document.createElement("div");if(u.className="canopy-header",e.title){let s=document.createElement("h2");s.className="canopy-title",s.textContent=e.title,u.appendChild(s)}if(e.description){let s=document.createElement("p");s.className="canopy-description",s.textContent=e.description,u.appendChild(s)}this.container.appendChild(u)}let n=document.createElement("div");n.className="canopy-status",n.setAttribute("role","status"),this.statusEl=n;let p=document.createElement("form");p.className="canopy-form",p.addEventListener("submit",u=>this.handleSubmit(u)),this.formEl=p,e.fields.forEach(u=>{let{wrapper:s,input:c,errorEl:d}=this.createField(u);s&&p.appendChild(s),this.fieldElements.set(u.name,{input:c,errorEl:d})});let m=document.createElement("button");m.type="submit",m.className="canopy-submit",m.textContent=a.buttonText||"Submit";let o=getComputedStyle(this.container),i=o.getPropertyValue("--canopy-primary").trim()||"#0ea5e9",y=o.getPropertyValue("--canopy-button-text").trim()||"#ffffff",b=o.getPropertyValue("--canopy-radius").trim()||"8px",g=o.getPropertyValue("--canopy-button-width").trim()||"100%";m.style.cssText=`
      display: block !important;
      width: ${g} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${b} !important;
      padding: 10px 16px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: ${i} !important;
      background-color: ${i} !important;
      color: ${y} !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=m;let f=document.createElement("div");f.className="canopy-form-actions",f.appendChild(m),p.appendChild(f),this.container.appendChild(n),this.container.appendChild(p)}createField(e){let a=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field";let r=document.createElement("label");if(r.className="canopy-label",r.htmlFor=a,r.textContent=e.label||e.name,e.required){let o=document.createElement("span");o.className="canopy-required",o.textContent=" *",r.appendChild(o)}let n;switch(e.type){case"TEXTAREA":{let o=document.createElement("textarea");o.className="canopy-textarea";let i=L(e);if(i){let y=Math.min(Math.max(Math.ceil(i/60),4),15);o.rows=y}else o.rows=4;n=o;break}case"DROPDOWN":{let o=e.options,i=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o),y=i?o.options:Array.isArray(o)?o:[],b=i?o.defaultValue:void 0,g=i?o.allowOther:!1,f=document.createElement("select");if(f.className="canopy-select",y.forEach(u=>{let s=document.createElement("option");s.value=u.value,s.textContent=u.label,b&&u.value===b&&(s.selected=!0),f.appendChild(s)}),g){let u=document.createElement("option");u.value="__other__",u.textContent="Other",f.appendChild(u)}if(n=f,g){let u=document.createElement("input");u.type="text",u.className="canopy-input canopy-select-other",u.name=`${e.name}_other`,u.placeholder="Please specify...",u.style.setProperty("display","none","important"),u.style.marginTop="0.5rem",u.addEventListener("input",()=>{u.setCustomValidity("")}),f.addEventListener("change",()=>{f.value==="__other__"?(u.style.setProperty("display","block","important"),e.required&&(u.required=!0)):(u.style.setProperty("display","none","important"),u.required=!1,u.value="")}),f.__otherInput=u}break}case"CHECKBOX":{let o=document.createElement("label");o.className="canopy-checkbox";let i=document.createElement("input");i.type="checkbox",i.id=a,i.name=e.name,i.addEventListener("change",()=>{i.setCustomValidity("")}),o.appendChild(i);let y=document.createElement("span");if(y.textContent=e.label||e.name,o.appendChild(y),t.appendChild(o),e.helpText){let g=document.createElement("p");g.className="canopy-help-text",g.textContent=e.helpText,t.appendChild(g)}let b=document.createElement("span");return b.className="canopy-error",b.id=`${a}-error`,t.appendChild(b),i.setAttribute("aria-describedby",b.id),i.setAttribute("aria-invalid","false"),{wrapper:t,input:i,errorEl:b}}case"CHECKBOXES":{let o=e.options,y=o&&typeof o=="object"&&"options"in o&&!Array.isArray(o)?o.options:Array.isArray(o)?o:[],b=document.createElement("div");b.className="canopy-checkboxes",b.setAttribute("data-checkbox-group",e.name),y.forEach(u=>{let s=document.createElement("label");s.className="canopy-checkbox";let c=document.createElement("input");c.type="checkbox",c.name=e.name,c.value=u.value,c.addEventListener("change",()=>{let h=b.querySelector("input[type=checkbox]");h&&h.setCustomValidity("")});let d=document.createElement("span");d.textContent=u.label,s.appendChild(c),s.appendChild(d),b.appendChild(s)});let g=document.createElement("input");if(g.type="hidden",g.id=a,g.name=e.name,t.appendChild(r),t.appendChild(b),e.helpText){let u=document.createElement("p");u.className="canopy-help-text",u.textContent=e.helpText,t.appendChild(u)}let f=document.createElement("span");return f.className="canopy-error",f.id=`${a}-error`,t.appendChild(f),g.setAttribute("aria-describedby",f.id),g.setAttribute("aria-invalid","false"),{wrapper:t,input:g,errorEl:f}}case"EMAIL":{let o=document.createElement("input");o.type="email",o.className="canopy-input",n=o;break}case"PHONE":{let o=document.createElement("input");o.type="tel",o.setAttribute("inputmode","tel"),o.setAttribute("autocomplete","tel"),o.className="canopy-input",n=o;break}case"DATE":{let o=document.createElement("input");o.type="date",o.className="canopy-input";let i=e.validation;i&&(i.minDate&&(o.min=this.resolveDate(i.minDate)),i.maxDate&&(o.max=this.resolveDate(i.maxDate)),i.noFuture&&(o.max=new Date().toISOString().split("T")[0]),i.noPast&&(o.min=new Date().toISOString().split("T")[0])),n=o;break}case"NUMBER":{let o=document.createElement("input");o.type="number",o.className="canopy-input";let i=e.validation;i!=null&&i.integer?(o.setAttribute("inputmode","numeric"),o.setAttribute("step","1")):(o.setAttribute("inputmode","decimal"),o.setAttribute("step","any")),(i==null?void 0:i.min)!==void 0&&o.setAttribute("min",String(i.min)),(i==null?void 0:i.max)!==void 0&&o.setAttribute("max",String(i.max)),n=o;break}case"NAME":return this.createNameField(e);case"ADDRESS":return this.createAddressField(e);default:{let o=document.createElement("input");o.type="text",o.className="canopy-input",n=o}}n.id=a,n.name=e.name,n.setAttribute("aria-invalid","false"),e.placeholder&&n.setAttribute("placeholder",e.placeholder);let p=L(e);p&&(n instanceof HTMLInputElement||n instanceof HTMLTextAreaElement)&&(n.maxLength=p),n.addEventListener("input",()=>{n.setCustomValidity("")});let m=document.createElement("span");if(m.className="canopy-error",m.id=`${a}-error`,n.setAttribute("aria-describedby",m.id),t.appendChild(r),t.appendChild(n),n.__otherInput&&t.appendChild(n.__otherInput),e.helpText){let o=document.createElement("p");o.className="canopy-help-text",o.textContent=e.helpText,t.appendChild(o)}return t.appendChild(m),{wrapper:t,input:n,errorEl:m}}resolveDate(e){return e==="today"?new Date().toISOString().split("T")[0]:e}createNameField(e){let a=`${this.instanceId}-${e.name}`,t=document.createElement("div");t.className="canopy-field canopy-name-group";let r=document.createElement("label");r.className="canopy-label",r.textContent=e.label||e.name,t.appendChild(r);let n=e.options||{parts:["first","last"]},p=n.parts||["first","last"],m=n.partLabels||{},o=n.partsRequired||{},i={first:"First Name",last:"Last Name",middle:"Middle Name",middleInitial:"M.I.",single:"Full Name"},y=document.createElement("div");y.className="canopy-name-parts";let b=document.createElement("input");b.type="hidden",b.id=a,b.name=e.name;let g=document.createElement("span");if(g.className="canopy-error",g.id=`${a}-error`,p.forEach(f=>{let u=document.createElement("div");u.className="canopy-name-part";let s=document.createElement("label");s.className="canopy-name-part-label";let c=`${a}-${f}`;if(s.htmlFor=c,s.textContent=m[f]||i[f]||f,e.required||o[f]){let h=document.createElement("span");h.className="canopy-required",h.textContent=" *",s.appendChild(h)}let d=document.createElement("input");d.type="text",d.className="canopy-input",d.id=c,d.name=`${e.name}.${f}`,d.setAttribute("data-name-part",f),d.setAttribute("data-name-field",e.name),d.addEventListener("input",()=>{y.querySelectorAll("input[data-name-part]").forEach(h=>h.setCustomValidity(""))}),u.appendChild(s),u.appendChild(d),y.appendChild(u)}),t.appendChild(y),e.helpText){let f=document.createElement("p");f.className="canopy-help-text",f.textContent=e.helpText,t.appendChild(f)}return t.appendChild(g),{wrapper:t,input:b,errorEl:g}}createAddressField(e){let a=`${this.instanceId}-${e.name}`,t=e.options||{},r=document.createElement("div");r.className="canopy-field canopy-address-group";let n=document.createElement("label");n.className="canopy-label",n.textContent=e.label||"Address",r.appendChild(n);let p=document.createElement("div");p.className="canopy-address-parts";let m=document.createElement("input");m.type="hidden",m.id=a,m.name=e.name;let o=document.createElement("span");o.className="canopy-error",o.id=`${a}-error`;let i=[{key:"line1",label:"Street Address",tag:"input"}];if(t.showLine2!==!1&&i.push({key:"line2",label:"Apt, Suite, etc.",tag:"input"}),i.push({key:"city",label:"City",tag:"input"},{key:"region",label:"State",tag:"select"},{key:"postalCode",label:"ZIP Code",tag:"input",attrs:{maxlength:"10",inputmode:"numeric"}}),i.forEach(y=>{let b=document.createElement("div");b.className="canopy-address-part";let g=document.createElement("label");g.className="canopy-address-part-label";let f=`${a}-${y.key}`;if(g.htmlFor=f,g.textContent=y.label,e.required&&y.key!=="line2"){let s=document.createElement("span");s.className="canopy-required",s.textContent=" *",g.appendChild(s)}let u;if(y.tag==="select"){let s=document.createElement("select");s.className="canopy-select";let c=document.createElement("option");c.value="",c.textContent="Select...",s.appendChild(c),z.forEach(d=>{let h=document.createElement("option");h.value=d.value,h.textContent=d.label,s.appendChild(h)}),s.addEventListener("change",()=>{p.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(d=>d.setCustomValidity(""))}),u=s}else{let s=document.createElement("input");s.type="text",s.className="canopy-input",y.attrs&&Object.entries(y.attrs).forEach(([c,d])=>s.setAttribute(c,d)),s.addEventListener("input",()=>{p.querySelectorAll("input[data-address-part], select[data-address-part]").forEach(c=>c.setCustomValidity(""))}),u=s}u.id=f,u.setAttribute("data-address-part",y.key),u.setAttribute("data-address-field",e.name),b.appendChild(g),b.appendChild(u),p.appendChild(b)}),r.appendChild(p),e.helpText){let y=document.createElement("p");y.className="canopy-help-text",y.textContent=e.helpText,r.appendChild(y)}return r.appendChild(o),{wrapper:r,input:m,errorEl:o}}collectValues(){let e={};return this.fieldElements.forEach((a,t)=>{if(a.input instanceof HTMLInputElement)if(a.input.type==="checkbox")e[t]=a.input.checked;else if(a.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${t}"]`);if(r){let n=[];r.querySelectorAll("input[type=checkbox]:checked").forEach(p=>{n.push(p.value)}),e[t]=n}else{let n=this.container.querySelectorAll(`input[data-name-field="${t}"]`);if(n.length>0){let p={};n.forEach(m=>{let o=m,i=o.getAttribute("data-name-part");i&&(p[i]=o.value)}),e[t]=p}else{let p=this.container.querySelectorAll(`input[data-address-field="${t}"], select[data-address-field="${t}"]`);if(p.length>0){let m={};p.forEach(o=>{let i=o.getAttribute("data-address-part");i&&(m[i]=o.value)}),e[t]=m}else e[t]=a.input.value}}}else e[t]=a.input.value;else a.input instanceof HTMLSelectElement&&a.input.value==="__other__"&&a.input.__otherInput?e[t]=a.input.__otherInput.value:e[t]=a.input.value}),e}findFailingInput(e){let a=this.container.querySelectorAll(`input[data-name-field="${e}"]`);if(a.length>0){for(let n of a)if(!n.value.trim())return n;return a[0]}let t=["line1","city","region","postalCode"],r=this.container.querySelectorAll(`input[data-address-field="${e}"], select[data-address-field="${e}"]`);if(r.length>0){for(let n of r){let p=n.getAttribute("data-address-part");if(p&&t.includes(p)&&!n.value.trim())return n}return r[0]}return null}showErrors(e){this.fieldElements.forEach((t,r)=>{let n=e[r]||"";if(t.input.type==="hidden"){let p=this.container.querySelector(`[data-checkbox-group="${r}"]`);if(p){let m=p.querySelector("input[type=checkbox]");m&&m.setCustomValidity(n)}else{let m=n?this.findFailingInput(r):null;m?m.setCustomValidity(n):this.container.querySelectorAll(`input[data-name-field="${r}"], input[data-address-field="${r}"], select[data-address-field="${r}"]`).forEach(i=>i.setCustomValidity(""))}}else t.input.setCustomValidity(n);t.errorEl.textContent=n,t.input.setAttribute("aria-invalid",n?"true":"false")});let a=Object.keys(e);if(a.length>0){let t=this.fieldElements.get(a[0]);if(t)if(t.input.type==="hidden"){let r=this.container.querySelector(`[data-checkbox-group="${a[0]}"]`);if(r){let n=r.querySelector("input[type=checkbox]");n&&(n.reportValidity(),n.focus())}else{let n=this.findFailingInput(a[0]);n&&(n.reportValidity(),n.focus())}}else t.input.reportValidity(),t.input.focus()}}setStatus(e,a){this.statusEl&&(this.statusEl.textContent=e,this.statusEl.className=`canopy-status canopy-status-${a}`)}async handleSubmit(e){var r,n,p;if(e.preventDefault(),!this.formDefinition)return;this.setStatus("","info"),this.fieldElements.forEach((m,o)=>{if(m.input.setCustomValidity(""),m.input.type==="hidden"){let i=this.container.querySelector(`[data-checkbox-group="${o}"]`);if(i){let y=i.querySelector("input[type=checkbox]");y&&y.setCustomValidity("")}else this.container.querySelectorAll(`input[data-name-field="${o}"], input[data-address-field="${o}"], select[data-address-field="${o}"]`).forEach(b=>b.setCustomValidity(""))}});let a=this.collectValues(),t=H(this.formDefinition.fields,a);if(this.showErrors(t),Object.keys(t).length>0){let m=Object.keys(t).length;this.setStatus(`Please fix ${m} field${m>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let m=this.options.baseUrl||"",o=this.options.formId||((r=this.formDefinition)==null?void 0:r.formId);if(!o){this.setStatus("Form configuration error.","error");return}let i=await fetch(`${m}/api/embed/${o}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)}),y=await i.json();if(!i.ok){y!=null&&y.fields&&this.showErrors(y.fields),this.setStatus((y==null?void 0:y.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}e.target.reset(),this.renderSuccess(this.formDefinition.successMessage||"Thanks for your submission!")}catch(m){console.error(m),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let m=((p=(n=this.formDefinition)==null?void 0:n.defaultTheme)==null?void 0:p.buttonText)||"Submit";this.submitButton.textContent=m,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderSuccess(e){this.statusEl&&(this.statusEl.textContent="",this.statusEl.className="canopy-status"),this.formEl&&(this.formEl.style.display="none");let a=this.container.querySelector(".canopy-success");a&&a.remove();let t=document.createElement("div");t.className="canopy-success",t.setAttribute("role","status"),t.setAttribute("aria-live","polite");let r=document.createElement("div");r.className="canopy-success-icon",r.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',t.appendChild(r);let n=document.createElement("p");n.className="canopy-success-message",n.textContent=e,t.appendChild(n);let p=document.createElement("button");p.type="button",p.className="canopy-success-reset",p.textContent="Submit another response",p.addEventListener("click",()=>{this.formDefinition&&this.render(this.formDefinition)}),t.appendChild(p),this.container.appendChild(t)}renderSkeleton(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-skeleton";let a=[{labelW:"30%",type:"input"},{labelW:"45%",type:"input"},{labelW:"25%",type:"textarea"}],t=0,r=document.createElement("div");r.className="canopy-skeleton-bar canopy-skeleton-title",r.style.animationDelay=`${t}s`,e.appendChild(r),t+=.15;let n=document.createElement("div");n.className="canopy-skeleton-bar canopy-skeleton-desc",n.style.animationDelay=`${t}s`,e.appendChild(n),t+=.15;for(let m of a){let o=document.createElement("div");o.className="canopy-skeleton-field";let i=document.createElement("div");i.className="canopy-skeleton-bar canopy-skeleton-label",i.style.width=m.labelW,i.style.animationDelay=`${t}s`,o.appendChild(i),t+=.1;let y=document.createElement("div");y.className=`canopy-skeleton-bar canopy-skeleton-${m.type}`,y.style.animationDelay=`${t}s`,o.appendChild(y),t+=.15,e.appendChild(o)}let p=document.createElement("div");p.className="canopy-skeleton-bar canopy-skeleton-button",p.style.animationDelay=`${t}s`,e.appendChild(p),this.container.appendChild(e)}renderError(e){this.container.innerHTML="";let a=document.createElement("div");a.className="canopy-status canopy-status-error",a.textContent=e,this.container.appendChild(a)}renderInactive(){this.container.innerHTML="";let e=document.createElement("div");e.className="canopy-inactive",e.setAttribute("role","status");let a=document.createElement("h2");a.className="canopy-inactive-heading",a.textContent="Form Not Available",e.appendChild(a);let t=document.createElement("p");t.className="canopy-inactive-body",t.textContent="This form is not currently accepting responses. Please contact the form owner if you believe this is an error.",e.appendChild(t),this.container.appendChild(e)}};var R=`
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
`;var P="canopy-embed-styles";function K(){if(document.getElementById(P))return;let l=document.createElement("style");l.id=P,l.textContent=R,document.head.appendChild(l)}function j(l){var e;return l.dataset.baseUrl||((e=document.querySelector("script[data-base-url]"))==null?void 0:e.getAttribute("data-base-url"))||""}function Z(l){let e=l.dataset.theme;if(e)try{return JSON.parse(e)}catch(a){console.warn("Canopy Forms: invalid data-theme JSON");return}}function N(){K(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(e=>{if(e.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let a=e.dataset.canopyForm;if(!a){console.error("Canopy Forms: missing data-canopy-form attribute");return}e.dataset.canopyInitialized="true";let t=Z(e),r=j(e);new A(e,{formId:a,themeOverrides:t,baseUrl:r}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",N):N();window.CanopyForms={init:N,CanopyForm:A};})();
