const config = {
 poweredByHeader: false,
 outputFileTracingIncludes: {'/api/student/materials/upload':['./lib/document-extractor-process.mjs','./node_modules/pdfjs-dist/legacy/build/*.mjs','./node_modules/pdfjs-dist/package.json','./node_modules/fflate/**/*','./node_modules/saxes/**/*','./node_modules/xmlchars/**/*']},
 async headers() {
  return [{source:'/:path*',headers:[
   {key:'X-Content-Type-Options',value:'nosniff'},
   {key:'X-Frame-Options',value:'DENY'},
   {key:'Referrer-Policy',value:'same-origin'},
   {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
   {key:'Content-Security-Policy',value:"frame-ancestors 'none'; object-src 'none'; base-uri 'self'"}
  ]}];
 }
};
export default config;

