import {zipSync,strToU8} from 'fflate';
export function wordFixture(text='Cells divide.',options={}){
 const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 const files={'[Content_Types].xml':strToU8('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),'word/document.xml':strToU8(`<w:document xmlns:w="${ns}"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p><w:p><w:r><w:t>DNA carries information.</w:t></w:r></w:p></w:body></w:document>`),...options};
 return zipSync(files);
}
export function pdfFixture(text='Cells divide.'){
 const stream=`BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
 const objs=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
 let result='%PDF-1.7\n',offsets=[0];
 for(let i=0;i<objs.length;i++){offsets.push(Buffer.byteLength(result));result+=`${i+1} 0 obj\n${objs[i]}\nendobj\n`;}
 const xref=Buffer.byteLength(result);
 result+=`xref\n0 6\n0000000000 65535 f \n`+offsets.slice(1).map(x=>String(x).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
 return new Uint8Array(Buffer.from(result));
}
