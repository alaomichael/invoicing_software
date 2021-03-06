export default function (
  fileName: string,
  arrayBuffer: ArrayBuffer,
  contentType: string
) {
  try {
    const blob = new Blob([arrayBuffer], { type: contentType });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    if (link.download !== undefined) {
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (e) {
    console.error('useInvoiceQuo error', e);
  }
}
