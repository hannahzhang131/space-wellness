import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export async function exportPdf(html: string): Promise<void> {
  if (Platform.OS === 'web') {
    printHtmlInBrowser(html);
    return;
  }
  const file = await Print.printToFileAsync({
    html,
    margins: { top: 28, bottom: 28, left: 22, right: 22 },
  });
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device. The PDF was saved in the app cache.');
  }
  await Sharing.shareAsync(file.uri, {
    UTI: 'com.adobe.pdf',
    mimeType: 'application/pdf',
    dialogTitle: 'Condition report',
  });
}

function printHtmlInBrowser(html: string): void {
  if (typeof document === 'undefined') {
    throw new Error('Printing is not available here.');
  }
  const iframe = document.createElement('iframe');
  iframe.setAttribute('style', 'position:fixed;width:0;height:0;border:0');
  document.body.appendChild(iframe);
  const frame = iframe.contentWindow;
  const doc = frame?.document;
  if (!frame || !doc) throw new Error('Printing is not available here.');
  doc.open();
  doc.write(html);
  doc.close();
  frame.focus();
  frame.print();
  setTimeout(() => iframe.remove(), 1200);
}
