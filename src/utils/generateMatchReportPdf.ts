/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { MatchState, MatchHistory } from '../types';

export function generateMatchReportPdf(state: MatchState, histories: MatchHistory[] = []): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let currentY = 16;

  // Outer border
  doc.setDrawColor(15, 23, 42); // slate-900
  doc.setLineWidth(0.7);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN RESMI HASIL SKORING PERTANDINGAN', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('IKATAN PENCAK SILAT INDONESIA (IPSI) - DIGITAL MATCH COMMISSION', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  // Double line header divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(12, currentY, pageWidth - 12, currentY);
  doc.line(12, currentY + 0.8, pageWidth - 12, currentY + 0.8);
  currentY += 6;

  // 1. Metadata Event & General Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(12, currentY, pageWidth - 24, 18, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('NAMA EVENT / TURNAMEN :', 16, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${state.namaEvent || 'Kejuaraan Pencak Silat Digital'}`, 65, currentY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text('WAKTU CETAK DOKUMEN   :', 16, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })} WIB`, 65, currentY + 11.5);

  currentY += 23;

  // 2. Active Match Details (Partai, Atlet, Skor, Hukuman, Durasi)
  if (state.partai) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('A. DETAIL PERTANDINGAN AKTIF / TERAKHIR', 12, currentY);
    currentY += 4.5;

    // Header banner of active match
    doc.setFillColor(15, 23, 42);
    doc.rect(12, currentY, pageWidth - 24, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`PARTAI: ${state.partai}   |   KELAS: ${state.kelas}   |   GENDER: ${state.gender.toUpperCase()}`, 16, currentY + 4.8);
    doc.text(`STATUS: ${state.matchStatus.toUpperCase()}`, pageWidth - 16, currentY + 4.8, { align: 'right' });
    currentY += 9;

    // Athlete Profile Bar (Merah vs Biru)
    const cardHeight = 16;
    doc.setFillColor(254, 242, 242); // Red tint
    doc.setDrawColor(254, 202, 202);
    doc.rect(12, currentY, (pageWidth - 26) / 2, cardHeight, 'FD');

    doc.setFillColor(239, 246, 255); // Blue tint
    doc.setDrawColor(191, 219, 254);
    doc.rect(12 + (pageWidth - 26) / 2 + 2, currentY, (pageWidth - 26) / 2, cardHeight, 'FD');

    // Red Corner Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(220, 38, 38);
    doc.text('SUDUT MERAH', 15, currentY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${state.atletMerah.nama || 'Atlet Merah'}`, 15, currentY + 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Kontingen: ${state.atletMerah.kontingen || '-'}`, 15, currentY + 13.5);

    // Blue Corner Details
    const blueLeft = 12 + (pageWidth - 26) / 2 + 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(37, 99, 235);
    doc.text('SUDUT BIRU', blueLeft + 3, currentY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${state.atletBiru.nama || 'Atlet Biru'}`, blueLeft + 3, currentY + 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Kontingen: ${state.atletBiru.kontingen || '-'}`, blueLeft + 3, currentY + 13.5);

    currentY += cardHeight + 4;

    // 2.1 Durasi Pertandingan Info Box
    const durasiMenit = Math.floor(state.selectedWaktu / 60);
    const durasiDetik = state.selectedWaktu % 60;
    const timerMins = Math.floor(state.timerSeconds / 60).toString().padStart(2, '0');
    const timerSecs = (state.timerSeconds % 60).toString().padStart(2, '0');
    const totalEstimasiMenit = Math.floor((state.selectedWaktu * 3) / 60);

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(12, currentY, pageWidth - 24, 13, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('INFORMASI DURASI PERTANDINGAN :', 15, currentY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Alokasi per Babak: ${durasiMenit}m ${durasiDetik}s (${state.selectedWaktu} detik)  |  Jumlah Babak: 3 Babak (Total: ${totalEstimasiMenit} Menit)`,
      70,
      currentY + 4.5
    );

    doc.setFont('helvetica', 'bold');
    doc.text('STATUS WAKTU & BABAK AKTIF   :', 15, currentY + 9.5);
    doc.setFont('helvetica', 'normal');
    const timerStatusLabel = state.timerActive ? 'WAKTU BERJALAN' : state.matchStatus === 'selesai' ? 'SELESAI' : 'BERHENTI / JEDA';
    doc.text(
      `Babak ${state.currentBabak} dari 3  |  Sisa Waktu Timer: ${timerMins}:${timerSecs}  |  Status Timer: ${timerStatusLabel}`,
      70,
      currentY + 9.5
    );

    currentY += 17;

    // 2.2 Table: Detail Skor Akhir & Rincian Babak
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('RINCIAN SKOR TIAP BABAK & POIN JATUHAN', 12, currentY);
    currentY += 3.5;

    // Table Header
    doc.setFillColor(30, 41, 59);
    doc.rect(12, currentY, pageWidth - 24, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Kategori Nilai', 15, currentY + 4.2);
    doc.text('Babak 1', 65, currentY + 4.2, { align: 'center' });
    doc.text('Babak 2', 90, currentY + 4.2, { align: 'center' });
    doc.text('Babak 3', 115, currentY + 4.2, { align: 'center' });
    doc.text('Poin Jatuhan (+3)', 145, currentY + 4.2, { align: 'center' });
    doc.text('TOTAL AKHIR', 180, currentY + 4.2, { align: 'center' });
    currentY += 6;

    // Row: Sudut Merah
    doc.setFillColor(254, 242, 242);
    doc.rect(12, currentY, pageWidth - 24, 6, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(12, currentY + 6, pageWidth - 12, currentY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(220, 38, 38);
    doc.text(`MERAH: ${state.atletMerah.nama}`, 15, currentY + 4.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`${state.scores.merah.babak1}`, 65, currentY + 4.2, { align: 'center' });
    doc.text(`${state.scores.merah.babak2}`, 90, currentY + 4.2, { align: 'center' });
    doc.text(`${state.scores.merah.babak3}`, 115, currentY + 4.2, { align: 'center' });
    doc.text(`+${state.directPoints.merah}`, 145, currentY + 4.2, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`${state.scores.merah.total}`, 180, currentY + 4.2, { align: 'center' });
    currentY += 6;

    // Row: Sudut Biru
    doc.setFillColor(239, 246, 255);
    doc.rect(12, currentY, pageWidth - 24, 6, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(12, currentY + 6, pageWidth - 12, currentY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(37, 99, 235);
    doc.text(`BIRU: ${state.atletBiru.nama}`, 15, currentY + 4.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`${state.scores.biru.babak1}`, 65, currentY + 4.2, { align: 'center' });
    doc.text(`${state.scores.biru.babak2}`, 90, currentY + 4.2, { align: 'center' });
    doc.text(`${state.scores.biru.babak3}`, 115, currentY + 4.2, { align: 'center' });
    doc.text(`+${state.directPoints.biru}`, 145, currentY + 4.2, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(`${state.scores.biru.total}`, 180, currentY + 4.2, { align: 'center' });
    currentY += 9;

    // 2.3 Table: Detail Hukuman & Sanksi Dewan Hakim
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('RINCIAN HUKUMAN & SANKSI DEWAN HAKIM (PENALTIES)', 12, currentY);
    currentY += 3.5;

    // Penalty Table Header
    doc.setFillColor(30, 41, 59);
    doc.rect(12, currentY, pageWidth - 24, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Sudut Atlet', 15, currentY + 4.2);
    doc.text('Binaan I / II', 55, currentY + 4.2, { align: 'center' });
    doc.text('Teguran I (-1)', 82, currentY + 4.2, { align: 'center' });
    doc.text('Teguran II (-2)', 108, currentY + 4.2, { align: 'center' });
    doc.text('Peringatan I (-5)', 136, currentY + 4.2, { align: 'center' });
    doc.text('Peringatan II (-10)', 164, currentY + 4.2, { align: 'center' });
    doc.text('Diskualifikasi', 188, currentY + 4.2, { align: 'center' });
    currentY += 6;

    const redPen = state.dewanPenalties.merah;
    const bluePen = state.dewanPenalties.biru;

    const calcPenaltyDeduction = (p: typeof redPen) => {
      let deduction = 0;
      if (p.teguran1) deduction += 1;
      if (p.teguran2) deduction += 2;
      if (p.peringatan1) deduction += 5;
      if (p.peringatan2) deduction += 10;
      return deduction;
    };

    // Row: Hukuman Merah
    doc.setFillColor(255, 255, 255);
    doc.rect(12, currentY, pageWidth - 24, 5.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(12, currentY + 5.5, pageWidth - 12, currentY + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(220, 38, 38);
    doc.text('SUDUT MERAH', 15, currentY + 3.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const binaanMerahStr = `${redPen.binaan1 ? 'B1' : '-'}${redPen.binaan2 ? ', B2' : ''}`;
    doc.text(binaanMerahStr, 55, currentY + 3.8, { align: 'center' });
    doc.text(redPen.teguran1 ? 'YA (-1)' : '-', 82, currentY + 3.8, { align: 'center' });
    doc.text(redPen.teguran2 ? 'YA (-2)' : '-', 108, currentY + 3.8, { align: 'center' });
    doc.text(redPen.peringatan1 ? 'YA (-5)' : '-', 136, currentY + 3.8, { align: 'center' });
    doc.text(redPen.peringatan2 ? 'YA (-10)' : '-', 164, currentY + 3.8, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(redPen.disqualified ? 220 : 15, redPen.disqualified ? 38 : 23, redPen.disqualified ? 38 : 42);
    doc.text(redPen.disqualified ? 'DISKUALIFIKASI' : 'TIDAK', 188, currentY + 3.8, { align: 'center' });
    currentY += 5.5;

    // Row: Hukuman Biru
    doc.setFillColor(248, 250, 252);
    doc.rect(12, currentY, pageWidth - 24, 5.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(12, currentY + 5.5, pageWidth - 12, currentY + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(37, 99, 235);
    doc.text('SUDUT BIRU', 15, currentY + 3.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const binaanBiruStr = `${bluePen.binaan1 ? 'B1' : '-'}${bluePen.binaan2 ? ', B2' : ''}`;
    doc.text(binaanBiruStr, 55, currentY + 3.8, { align: 'center' });
    doc.text(bluePen.teguran1 ? 'YA (-1)' : '-', 82, currentY + 3.8, { align: 'center' });
    doc.text(bluePen.teguran2 ? 'YA (-2)' : '-', 108, currentY + 3.8, { align: 'center' });
    doc.text(bluePen.peringatan1 ? 'YA (-5)' : '-', 136, currentY + 3.8, { align: 'center' });
    doc.text(bluePen.peringatan2 ? 'YA (-10)' : '-', 164, currentY + 3.8, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(bluePen.disqualified ? 220 : 15, bluePen.disqualified ? 38 : 23, bluePen.disqualified ? 38 : 42);
    doc.text(bluePen.disqualified ? 'DISKUALIFIKASI' : 'TIDAK', 188, currentY + 3.8, { align: 'center' });
    currentY += 8;

    // Winner Summary Box
    doc.setFillColor(254, 252, 232); // Amber light
    doc.setDrawColor(250, 204, 21);
    doc.rect(12, currentY, pageWidth - 24, 10, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('KEPUTUSAN PEMENANG :', 16, currentY + 6.5);

    const winnerCorner = state.winner;
    const winnerName = winnerCorner === 'biru' ? state.atletBiru.nama : winnerCorner === 'merah' ? state.atletMerah.nama : 'BELUM DITETAPKAN / SERI';
    const winnerColor = winnerCorner === 'merah' ? [220, 38, 38] : winnerCorner === 'biru' ? [37, 99, 235] : [100, 116, 139];
    doc.setTextColor(winnerColor[0], winnerColor[1], winnerColor[2]);
    doc.text(
      `${winnerCorner ? `SUDUT ${winnerCorner.toUpperCase()} - ${winnerName.toUpperCase()}` : 'PERTANDINGAN SERI / SEDANG BERLANGSUNG'} (SKOR ${state.scores.merah.total} : ${state.scores.biru.total})`,
      65,
      currentY + 6.5
    );

    currentY += 15;
  }

  // 3. Historical entries table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('B. RIWAYAT HASIL PERTANDINGAN SEBELUMNYA (HISTORY LOGS)', 12, currentY);
  currentY += 4;

  // History Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(12, currentY, pageWidth - 24, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('No', 15, currentY + 4.2);
  doc.text('Partai', 23, currentY + 4.2);
  doc.text('Kelas', 34, currentY + 4.2);
  doc.text('Gender', 47, currentY + 4.2);
  doc.text('Sudut Merah (Skor)', 62, currentY + 4.2);
  doc.text('Sudut Biru (Skor)', 115, currentY + 4.2);
  doc.text('Pemenang', 168, currentY + 4.2);
  currentY += 6;

  if (histories.length === 0) {
    doc.setDrawColor(203, 213, 225);
    doc.rect(12, currentY, pageWidth - 24, 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Belum ada riwayat pertarungan resmi lain yang tersimpan.', pageWidth / 2, currentY + 4.8, { align: 'center' });
    currentY += 7;
  } else {
    histories.forEach((h, idx) => {
      if (currentY > pageHeight - 38) {
        doc.addPage();
        currentY = 16;
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.7);
        doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
      }

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(12, currentY, pageWidth - 24, 6, 'F');
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(12, currentY + 6, pageWidth - 12, currentY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text((idx + 1).toString(), 15, currentY + 4.2);
      doc.text(h.partai, 23, currentY + 4.2);
      doc.text(h.kelas, 34, currentY + 4.2);
      doc.text(h.gender === 'Putra' ? 'PA' : 'PI', 47, currentY + 4.2);
      doc.text(`${h.atletMerah.nama} (${h.skorAkhirMerah})`, 62, currentY + 4.2);
      doc.text(`${h.atletBiru.nama} (${h.skorAkhirBiru})`, 115, currentY + 4.2);

      const winLabel = h.winner === 'merah' ? 'MERAH' : h.winner === 'biru' ? 'BIRU' : 'SERI';
      const winColor = h.winner === 'merah' ? [220, 38, 38] : h.winner === 'biru' ? [37, 99, 235] : [100, 116, 139];
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(winColor[0], winColor[1], winColor[2]);
      doc.text(winLabel, 168, currentY + 4.2);

      currentY += 6;
    });
  }

  // 4. Signatures Section at bottom
  currentY = Math.max(currentY + 10, pageHeight - 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  doc.text('Ketua Dewan Pertandingan,', 18, currentY);
  doc.text('Sekretaris Pertandingan,', pageWidth - 68, currentY);

  doc.setDrawColor(148, 163, 184);
  doc.line(18, currentY + 16, 68, currentY + 16);
  doc.line(pageWidth - 68, currentY + 16, pageWidth - 18, currentY + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('( ________________________ )', 18, currentY + 20);
  doc.text('( ________________________ )', pageWidth - 68, currentY + 20);

  // Add Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Halaman ${i} dari ${totalPages} | Sistem Skoring Digital IPSI`, pageWidth / 2, pageHeight - 5, { align: 'center' });
  }

  // Save the PDF
  const filename = `Laporan_Hasil_Pertandingan_Partai_${state.partai || '0'}_${Date.now()}.pdf`;
  doc.save(filename);
}

export interface AllMatchesReportOptions {
  state: MatchState;
  histories?: MatchHistory[];
  baganData?: any[];
  tgrState?: any;
  tournamentTitle?: string;
  gelanggang?: string;
}

export function createAllMatchesReportPdfDoc(options: AllMatchesReportOptions): { doc: jsPDF; filename: string } {
  const { state, histories = [], baganData = [], tgrState } = options;
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for rich tournament tabular data
  const pageWidth = doc.internal.pageSize.getWidth(); // 297 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm

  const eventName = options.tournamentTitle || state.namaEvent || 'Kejuaraan Pencak Silat';
  const gelanggangName = options.gelanggang || state.gelanggang || 'Gelanggang Utama';

  // Helper function to draw page header & frame
  const drawPageDecoration = (titleText: string, pageNum: number) => {
    // Outer border
    doc.setDrawColor(15, 23, 42); // slate-900
    doc.setLineWidth(0.6);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

    // Inner gold accent line
    doc.setDrawColor(217, 119, 6); // amber-600
    doc.setLineWidth(0.2);
    doc.rect(9.5, 9.5, pageWidth - 19, pageHeight - 19);

    // Top Header Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(12, 12, pageWidth - 24, 15, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('IKATAN PENCAK SILAT INDONESIA (IPSI) - DIGITAL MATCH COMMISSION', 16, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`${eventName.toUpperCase()} | GELANGGANG: ${gelanggangName.toUpperCase()}`, 16, 23);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(251, 191, 36); // amber-400
    doc.text(titleText.toUpperCase(), pageWidth - 16, 18, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`WAKTU CETAK: ${new Date().toLocaleString('id-ID')} WIB`, pageWidth - 16, 23, { align: 'right' });
  };

  // Compile Unified Tanding Matches List
  interface ReportMatchRow {
    no: number;
    partai: string;
    gelanggang: string;
    kategoriKelas: string;
    babak: string;
    sudutMerah: { nama: string; kontingen: string; skor?: number };
    sudutBiru: { nama: string; kontingen: string; skor?: number };
    skorStr: string;
    pemenang: string;
    status: 'SELESAI' | 'BERLANGSUNG' | 'TERJADWAL';
  }

  const matchesMap = new Map<string, ReportMatchRow>();
  let autoIndex = 1;

  // 1. Add all from historical completed matches
  histories.forEach((h) => {
    const pKey = h.partai ? h.partai.trim().toUpperCase() : `HISTORY_${autoIndex}`;
    const winStr = h.winner === 'merah' ? 'SUDUT MERAH' : h.winner === 'biru' ? 'SUDUT BIRU' : 'SERI';
    matchesMap.set(pKey, {
      no: autoIndex++,
      partai: h.partai || `Partai ${autoIndex}`,
      gelanggang: gelanggangName,
      kategoriKelas: `${h.kelas || '-'} (${h.gender === 'Putri' ? 'PI' : 'PA'})`,
      babak: 'Pertandingan Resmi',
      sudutMerah: { nama: h.atletMerah?.nama || 'Atlet Merah', kontingen: h.atletMerah?.kontingen || '-', skor: h.skorAkhirMerah },
      sudutBiru: { nama: h.atletBiru?.nama || 'Atlet Biru', kontingen: h.atletBiru?.kontingen || '-', skor: h.skorAkhirBiru },
      skorStr: `${h.skorAkhirMerah ?? 0} - ${h.skorAkhirBiru ?? 0}`,
      pemenang: winStr,
      status: 'SELESAI'
    });
  });

  // 2. Add active match if available
  if (state.partai) {
    const activeKey = state.partai.trim().toUpperCase();
    const existing = matchesMap.get(activeKey);
    const winStr = state.winner === 'merah' ? 'SUDUT MERAH' : state.winner === 'biru' ? 'SUDUT BIRU' : (state.winner ? 'SERI' : 'BELUM SELESAI');
    const statusVal = state.matchStatus === 'selesai' ? 'SELESAI' : 'BERLANGSUNG';
    
    if (!existing || existing.status !== 'SELESAI') {
      matchesMap.set(activeKey, {
        no: existing ? existing.no : autoIndex++,
        partai: state.partai,
        gelanggang: state.gelanggang || gelanggangName,
        kategoriKelas: `${state.kelas || '-'} (${state.gender === 'Putri' ? 'PI' : 'PA'})`,
        babak: 'Partai Berjalan',
        sudutMerah: { nama: state.atletMerah?.nama || 'Sudut Merah', kontingen: state.atletMerah?.kontingen || '-', skor: state.scores.merah.total },
        sudutBiru: { nama: state.atletBiru?.nama || 'Sudut Biru', kontingen: state.atletBiru?.kontingen || '-', skor: state.scores.biru.total },
        skorStr: `${state.scores.merah.total} - ${state.scores.biru.total}`,
        pemenang: winStr,
        status: statusVal
      });
    }
  }

  // 3. Add bracket matches from baganData
  if (Array.isArray(baganData)) {
    baganData.forEach((cat: any) => {
      const catName = cat.name || cat.kelas || 'Tanding';
      const catGender = cat.gender === 'Putri' ? 'PI' : 'PA';
      const roundLabelMap: Record<string, string> = {
        'thirtysecond': '1/32 Final',
        'sixteenth': '1/16 Final',
        'eighth': '1/8 Final',
        'quarter': 'Perempat Final',
        'semi': 'Semifinal',
        'final': 'Final'
      };

      if (Array.isArray(cat.matches)) {
        cat.matches.forEach((m: any) => {
          if (!m.partai) return;
          const pKey = m.partai.trim().toUpperCase();
          if (!matchesMap.has(pKey)) {
            const hasWinner = Boolean(m.winner);
            const winStr = m.winner === 'merah' ? 'SUDUT MERAH' : m.winner === 'biru' ? 'SUDUT BIRU' : '-';
            matchesMap.set(pKey, {
              no: autoIndex++,
              partai: m.partai,
              gelanggang: m.gelanggang || gelanggangName,
              kategoriKelas: `${catName} (${catGender})`,
              babak: roundLabelMap[m.round] || m.round || 'Bagan',
              sudutMerah: { nama: m.atletMerah?.nama || 'TBD', kontingen: m.atletMerah?.kontingen || '-' },
              sudutBiru: { nama: m.atletBiru?.nama || 'TBD', kontingen: m.atletBiru?.kontingen || '-' },
              skorStr: hasWinner ? 'Menang' : '-',
              pemenang: winStr,
              status: hasWinner ? 'SELESAI' : 'TERJADWAL'
            });
          }
        });
      }
    });
  }

  // Helper to sort by partai number
  const sortedMatches = Array.from(matchesMap.values()).sort((a, b) => {
    const numA = parseInt(a.partai.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.partai.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  // Re-number
  sortedMatches.forEach((m, idx) => {
    m.no = idx + 1;
  });

  // ----------------------------------------------------
  // PAGE 1: COVER & EXECUTIVE TOURNAMENT SUMMARY
  // ----------------------------------------------------
  drawPageDecoration('LAPORAN SELURUH PERTANDINGAN', 1);

  let curY = 32;

  // Title Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(12, curY, pageWidth - 24, 24, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('BUKU LAPORAN KESELURUHAN HASIL PERTANDINGAN', pageWidth / 2, curY + 7.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(217, 119, 6); // amber-600
  doc.text(eventName.toUpperCase(), pageWidth / 2, curY + 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Dokumen Resmi Rekapitulasi Pertandingan Tanding, Kategori Seni IPSI, dan Perolehan Medali', pageWidth / 2, curY + 19.5, { align: 'center' });

  curY += 28;

  // 4 KPI Summary Cards
  const totalPartaiTanding = sortedMatches.length;
  const totalPartaiSelesai = sortedMatches.filter(m => m.status === 'SELESAI').length;
  const totalPesertaSeni = tgrState?.pesertaList?.length || 0;
  
  // Calculate unique contingents
  const contingentSet = new Set<string>();
  sortedMatches.forEach(m => {
    if (m.sudutMerah.kontingen && m.sudutMerah.kontingen !== '-') contingentSet.add(m.sudutMerah.kontingen);
    if (m.sudutBiru.kontingen && m.sudutBiru.kontingen !== '-') contingentSet.add(m.sudutBiru.kontingen);
  });
  if (tgrState?.pesertaList) {
    tgrState.pesertaList.forEach((p: any) => {
      if (p.kontingen) contingentSet.add(p.kontingen);
    });
  }

  const cardW = (pageWidth - 24 - 9) / 4;
  const cardsData = [
    { label: 'TOTAL PARTAI TANDING', val: totalPartaiTanding.toString(), sub: 'Partai Terdaftar / Bagan', color: [15, 23, 42] },
    { label: 'PARTAI SELESAI', val: totalPartaiSelesai.toString(), sub: `${Math.round((totalPartaiSelesai / (totalPartaiTanding || 1)) * 100)}% Terselesaikan`, color: [5, 150, 105] },
    { label: 'PESERTA SENI (TGR)', val: totalPesertaSeni.toString(), sub: 'Penampilan Terdata', color: [217, 119, 6] },
    { label: 'KONTINGEN / TIM', val: contingentSet.size.toString(), sub: 'Daerah / Perguruan', color: [37, 99, 235] }
  ];

  cardsData.forEach((c, i) => {
    const cardX = 12 + i * (cardW + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.rect(cardX, curY, cardW, 19, 'FD');

    // Colored top border
    doc.setFillColor(c.color[0], c.color[1], c.color[2]);
    doc.rect(cardX, curY, cardW, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, cardX + cardW / 2, curY + 6.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.val, cardX + cardW / 2, curY + 12.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(c.sub, cardX + cardW / 2, curY + 16.5, { align: 'center' });
  });

  curY += 23;

  // ----------------------------------------------------
  // SECTION I: TABEL REKAPITULASI PARTAI TANDING
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('I. REKAPITULASI KESELURUHAN PERTANDINGAN TANDING', 12, curY);

  curY += 4;

  const renderTandingTableHeader = (y: number) => {
    doc.setFillColor(15, 23, 42);
    doc.rect(12, y, pageWidth - 24, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('No', 15, y + 4.8);
    doc.text('Partai', 24, y + 4.8);
    doc.text('Gelanggang', 44, y + 4.8);
    doc.text('Kelas & Gender', 70, y + 4.8);
    doc.text('Babak', 114, y + 4.8);
    doc.text('Sudut Merah (Atlet / Kontingen)', 140, y + 4.8);
    doc.text('Sudut Biru (Atlet / Kontingen)', 200, y + 4.8);
    doc.text('Skor', 255, y + 4.8, { align: 'center' });
    doc.text('Pemenang / Status', 272, y + 4.8);
  };

  renderTandingTableHeader(curY);
  curY += 7;

  if (sortedMatches.length === 0) {
    doc.setDrawColor(226, 232, 240);
    doc.rect(12, curY, pageWidth - 24, 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Belum ada data partai tanding yang tercatat dalam sistem.', pageWidth / 2, curY + 5.5, { align: 'center' });
    curY += 12;
  } else {
    sortedMatches.forEach((m, idx) => {
      // Check page break
      if (curY > pageHeight - 25) {
        doc.addPage();
        drawPageDecoration('REKAPITULASI PARTAI TANDING (LANJUTAN)', doc.getNumberOfPages());
        curY = 32;
        renderTandingTableHeader(curY);
        curY += 7;
      }

      // Zebra background
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(12, curY, pageWidth - 24, 6.2, 'F');
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(12, curY + 6.2, pageWidth - 12, curY + 6.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(m.no.toString(), 15, curY + 4.3);

      doc.setFont('helvetica', 'bold');
      doc.text(m.partai, 24, curY + 4.3);

      doc.setFont('helvetica', 'normal');
      doc.text(m.gelanggang, 44, curY + 4.3);
      doc.text(m.kategoriKelas, 70, curY + 4.3);
      doc.text(m.babak, 114, curY + 4.3);

      // Red corner
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      const redText = `${m.sudutMerah.nama} (${m.sudutMerah.kontingen})`;
      doc.text(redText.length > 28 ? redText.substring(0, 26) + '..' : redText, 140, curY + 4.3);

      // Blue corner
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      const blueText = `${m.sudutBiru.nama} (${m.sudutBiru.kontingen})`;
      doc.text(blueText.length > 28 ? blueText.substring(0, 26) + '..' : blueText, 200, curY + 4.3);

      // Score
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(m.skorStr, 255, curY + 4.3, { align: 'center' });

      // Winner & status
      if (m.pemenang.includes('MERAH')) {
        doc.setTextColor(220, 38, 38);
        doc.text('MERAH', 272, curY + 4.3);
      } else if (m.pemenang.includes('BIRU')) {
        doc.setTextColor(37, 99, 235);
        doc.text('BIRU', 272, curY + 4.3);
      } else {
        doc.setTextColor(148, 163, 184);
        doc.text(m.status === 'BERLANGSUNG' ? 'BERJALAN' : (m.status === 'TERJADWAL' ? 'JADWAL' : '-'), 272, curY + 4.3);
      }

      curY += 6.2;
    });
  }

  curY += 8;

  // ----------------------------------------------------
  // SECTION II: REKAPITULASI KATEGORI SENI (TGR)
  // ----------------------------------------------------
  const pesertaSeniList: any[] = tgrState?.pesertaList || [];
  if (pesertaSeniList.length > 0) {
    if (curY > pageHeight - 50) {
      doc.addPage();
      drawPageDecoration('REKAPITULASI KATEGORI SENI (TGR)', doc.getNumberOfPages());
      curY = 32;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('II. REKAPITULASI HASIL SKORING KATEGORI SENI (TGR)', 12, curY);
    curY += 4;

    const renderSeniTableHeader = (y: number) => {
      doc.setFillColor(30, 41, 59);
      doc.rect(12, y, pageWidth - 24, 7, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('Rank', 15, y + 4.8);
      doc.text('No. Undian', 28, y + 4.8);
      doc.text('Nama Peserta / Tim', 48, y + 4.8);
      doc.text('Kontingen', 115, y + 4.8);
      doc.text('Kategori', 160, y + 4.8);
      doc.text('Waktu', 200, y + 4.8);
      doc.text('Hukuman', 222, y + 4.8);
      doc.text('Nilai Akhir', 248, y + 4.8);
      doc.text('Keterangan', 270, y + 4.8);
    };

    renderSeniTableHeader(curY);
    curY += 7;

    // Sort Seni participants by final score descending
    const sortedSeni = [...pesertaSeniList].sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

    sortedSeni.forEach((p, sIdx) => {
      if (curY > pageHeight - 25) {
        doc.addPage();
        drawPageDecoration('REKAPITULASI KATEGORI SENI (LANJUTAN)', doc.getNumberOfPages());
        curY = 32;
        renderSeniTableHeader(curY);
        curY += 7;
      }

      if (sIdx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(12, curY, pageWidth - 24, 6.2, 'F');
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(12, curY + 6.2, pageWidth - 12, curY + 6.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text((sIdx + 1).toString(), 15, curY + 4.3);
      doc.text(p.noUndian || (sIdx + 1).toString(), 28, curY + 4.3);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const pName = p.nama || '-';
      doc.text(pName.length > 32 ? pName.substring(0, 30) + '..' : pName, 48, curY + 4.3);

      doc.setFont('helvetica', 'normal');
      doc.text(p.kontingen || '-', 115, curY + 4.3);
      doc.text(p.kategori || 'Seni Tunggal', 160, curY + 4.3);
      doc.text(p.waktuTampil ? `${p.waktuTampil} s` : '-', 200, curY + 4.3);

      doc.setTextColor(220, 38, 38);
      doc.text(p.deductions ? `-${p.deductions.toFixed(2)}` : '0.00', 222, curY + 4.3);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text(p.finalScore ? p.finalScore.toFixed(3) : '0.000', 248, curY + 4.3);

      // Medals tag
      doc.setFont('helvetica', 'bold');
      if (sIdx === 0 && p.finalScore > 0) {
        doc.setTextColor(217, 119, 6);
        doc.text('EMAS (Juara 1)', 270, curY + 4.3);
      } else if (sIdx === 1 && p.finalScore > 0) {
        doc.setTextColor(100, 116, 139);
        doc.text('PERAK (Juara 2)', 270, curY + 4.3);
      } else if (sIdx === 2 && p.finalScore > 0) {
        doc.setTextColor(180, 83, 9);
        doc.text('PERUNGGU (3)', 270, curY + 4.3);
      } else {
        doc.setTextColor(148, 163, 184);
        doc.text('-', 270, curY + 4.3);
      }

      curY += 6.2;
    });

    curY += 8;
  }

  // ----------------------------------------------------
  // SECTION III: KLASEMEN PEROLEHAN MEDALI KONTINGEN
  // ----------------------------------------------------
  if (curY > pageHeight - 55) {
    doc.addPage();
    drawPageDecoration('KLASEMEN PEROLEHAN MEDALI & PENGESAHAN', doc.getNumberOfPages());
    curY = 32;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('III. KLASEMEN AKHIR PEROLEHAN MEDALI KONTINGEN', 12, curY);
  curY += 4;

  // Compute Medals Tally per Kontingen
  interface MedalCount {
    kontingen: string;
    emas: number;
    perak: number;
    perunggu: number;
    total: number;
  }

  const medalMap = new Map<string, MedalCount>();
  const getOrCreate = (kt: string): MedalCount => {
    if (!kt || kt === '-') kt = 'Independen';
    if (!medalMap.has(kt)) {
      medalMap.set(kt, { kontingen: kt, emas: 0, perak: 0, perunggu: 0, total: 0 });
    }
    return medalMap.get(kt)!;
  };

  // From completed matches where babak === 'Final' or histories
  sortedMatches.forEach((m) => {
    if (m.status === 'SELESAI' && m.pemenang) {
      if (m.babak.toLowerCase().includes('final') && !m.babak.toLowerCase().includes('semi')) {
        if (m.pemenang.includes('MERAH')) {
          getOrCreate(m.sudutMerah.kontingen).emas += 1;
          getOrCreate(m.sudutBiru.kontingen).perak += 1;
        } else if (m.pemenang.includes('BIRU')) {
          getOrCreate(m.sudutBiru.kontingen).emas += 1;
          getOrCreate(m.sudutMerah.kontingen).perak += 1;
        }
      } else if (m.babak.toLowerCase().includes('semi')) {
        // Loser gets bronze
        if (m.pemenang.includes('MERAH')) {
          getOrCreate(m.sudutBiru.kontingen).perunggu += 1;
        } else if (m.pemenang.includes('BIRU')) {
          getOrCreate(m.sudutMerah.kontingen).perunggu += 1;
        }
      }
    }
  });

  // From Seni participants top 3
  if (pesertaSeniList.length > 0) {
    const sortedSeni = [...pesertaSeniList].sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
    if (sortedSeni[0] && sortedSeni[0].finalScore > 0) getOrCreate(sortedSeni[0].kontingen).emas += 1;
    if (sortedSeni[1] && sortedSeni[1].finalScore > 0) getOrCreate(sortedSeni[1].kontingen).perak += 1;
    if (sortedSeni[2] && sortedSeni[2].finalScore > 0) getOrCreate(sortedSeni[2].kontingen).perunggu += 1;
  }

  // Calculate totals and sort
  const medalList = Array.from(medalMap.values()).map(m => ({
    ...m,
    total: m.emas + m.perak + m.perunggu
  })).sort((a, b) => {
    if (b.emas !== a.emas) return b.emas - a.emas;
    if (b.perak !== a.perak) return b.perak - a.perak;
    return b.perunggu - a.perunggu;
  });

  // Render Medal Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(12, curY, pageWidth - 24, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Peringkat', 16, curY + 4.5);
  doc.text('Nama Kontingen / Tim Daerah', 40, curY + 4.5);
  doc.text('Emas', 150, curY + 4.5, { align: 'center' });
  doc.text('Perak', 180, curY + 4.5, { align: 'center' });
  doc.text('Perunggu', 215, curY + 4.5, { align: 'center' });
  doc.text('Total Medali', 260, curY + 4.5, { align: 'center' });
  curY += 6.5;

  if (medalList.length === 0 || medalList.every(m => m.total === 0)) {
    doc.setDrawColor(226, 232, 240);
    doc.rect(12, curY, pageWidth - 24, 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Perolehan medali resmi akan diakumulasikan otomatis setelah babak semifinal dan final selesai.', pageWidth / 2, curY + 4.8, { align: 'center' });
    curY += 10;
  } else {
    medalList.slice(0, 10).forEach((m, mIdx) => {
      if (curY > pageHeight - 35) {
        doc.addPage();
        drawPageDecoration('KLASEMEN PEROLEHAN MEDALI (LANJUTAN)', doc.getNumberOfPages());
        curY = 32;
      }

      if (mIdx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(12, curY, pageWidth - 24, 6, 'F');
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(12, curY + 6, pageWidth - 12, curY + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text((mIdx + 1).toString(), 16, curY + 4.2);

      doc.setTextColor(15, 23, 42);
      doc.text(m.kontingen, 40, curY + 4.2);

      doc.setTextColor(217, 119, 6); // Emas
      doc.text(m.emas.toString(), 150, curY + 4.2, { align: 'center' });

      doc.setTextColor(100, 116, 139); // Perak
      doc.text(m.perak.toString(), 180, curY + 4.2, { align: 'center' });

      doc.setTextColor(180, 83, 9); // Perunggu
      doc.text(m.perunggu.toString(), 215, curY + 4.2, { align: 'center' });

      doc.setTextColor(15, 23, 42);
      doc.text(m.total.toString(), 260, curY + 4.2, { align: 'center' });

      curY += 6;
    });
  }

  curY += 8;

  // ----------------------------------------------------
  // SECTION IV: LEMBAR PENGESAHAN DOKUMEN RESMI
  // ----------------------------------------------------
  if (curY > pageHeight - 45) {
    doc.addPage();
    drawPageDecoration('LEMBAR PENGESAHAN PERTANDINGAN', doc.getNumberOfPages());
    curY = 36;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('IV. PENGESAHAN HASIL RESMI PERTANDINGAN (OFFICIAL SIGNATURES)', 12, curY);

  curY += 8;

  const signColWidth = (pageWidth - 24) / 4;
  const signs = [
    { role: 'Delegasi Teknik (TD)', name: '( ____________________ )' },
    { role: 'Ketua Pertandingan', name: '( ____________________ )' },
    { role: 'Ketua Dewan Juri', name: '( ____________________ )' },
    { role: 'Sekretaris Pertandingan', name: '( ____________________ )' }
  ];

  signs.forEach((s, idx) => {
    const sX = 12 + idx * signColWidth;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(s.role, sX + signColWidth / 2, curY, { align: 'center' });

    doc.setDrawColor(148, 163, 184);
    doc.line(sX + 10, curY + 18, sX + signColWidth - 10, curY + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(s.name, sX + signColWidth / 2, curY + 22, { align: 'center' });
  });

  // ----------------------------------------------------
  // ADD PAGE NUMBERING FOOTER ON ALL PAGES
  // ----------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Halaman ${i} dari ${totalPages}  |  Buku Laporan Resmi Seluruh Pertandingan  |  Sistem Skoring Digital IPSI`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  // Build PDF output
  const safeTitle = eventName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Laporan_Seluruh_Pertandingan_${safeTitle}_${Date.now()}.pdf`;
  return { doc, filename };
}

export function generateAllMatchesReportPdf(options: AllMatchesReportOptions): void {
  const { doc, filename } = createAllMatchesReportPdfDoc(options);
  doc.save(filename);
}

export function buildAllMatchesReportPdfBlob(options: AllMatchesReportOptions): { blob: Blob; filename: string } {
  const { doc, filename } = createAllMatchesReportPdfDoc(options);
  return {
    blob: doc.output('blob'),
    filename
  };
}

// ============================================================================
// LEMBAR REKAPITULASI NILAI AKHIR PERTANDINGAN (OFFICIAL SCORESHEET PDF)
// ============================================================================
export interface RekapitulasiNilaiAkhirOptions {
  state: MatchState;
  history?: MatchHistory | null;
  histories?: MatchHistory[];
  tournamentTitle?: string;
  gelanggang?: string;
  penyelenggara?: string;
  secretaryName?: string;
  ketuaPertandinganName?: string;
  dewanName?: string;
  wasitName?: string;
  jenisKemenangan?: string;
  catatanKhusus?: string;
}

export function generateRekapitulasiNilaiAkhirPdf(options: RekapitulasiNilaiAkhirOptions): void {
  const {
    state,
    history,
    histories = [],
    tournamentTitle,
    gelanggang,
    penyelenggara = 'Pengurus Besar Ikatan Pencak Silat Indonesia (PB IPSI)',
    secretaryName = 'Sekretaris Pertandingan',
    ketuaPertandinganName = 'Ketua Pertandingan',
    dewanName = 'Ketua Dewan Wasit Juri',
    wasitName = 'Wasit Panggung',
    jenisKemenangan = 'Menang Angka',
    catatanKhusus = ''
  } = options;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm

  const eventName = tournamentTitle || state.namaEvent || 'Kejuaraan Pencak Silat IPSI';
  const gelanggangName = gelanggang || state.gelanggang || 'Gelanggang 1';

  // Extract match data (either from specific history record or from active live state)
  const isHistoryMode = Boolean(history);
  const partaiNum = history?.partai || state.partai || '01';
  const kelasName = history?.kelas || state.kelas || 'Tanding Kelas';
  const genderName = history?.gender || state.gender || 'Putra';
  const atletMerahNama = (history?.atletMerah?.nama || state.atletMerah?.nama || 'SUDUT MERAH').toUpperCase();
  const atletMerahKontingen = (history?.atletMerah?.kontingen || state.atletMerah?.kontingen || 'KONTINGEN MERAH').toUpperCase();
  const atletBiruNama = (history?.atletBiru?.nama || state.atletBiru?.nama || 'SUDUT BIRU').toUpperCase();
  const atletBiruKontingen = (history?.atletBiru?.kontingen || state.atletBiru?.kontingen || 'KONTINGEN BIRU').toUpperCase();

  const winnerCorner = history ? history.winner : state.winner;
  const skorMerahTotal = history ? history.skorAkhirMerah : (state.scores?.merah?.total ?? 0);
  const skorBiruTotal = history ? history.skorAkhirBiru : (state.scores?.biru?.total ?? 0);

  // Round scores
  const b1Merah = isHistoryMode ? '-' : (state.scores?.merah?.babak1 ?? 0);
  const b2Merah = isHistoryMode ? '-' : (state.scores?.merah?.babak2 ?? 0);
  const b3Merah = isHistoryMode ? '-' : (state.scores?.merah?.babak3 ?? 0);
  const jatuhanMerah = isHistoryMode ? '-' : (state.directPoints?.merah ?? 0);

  const b1Biru = isHistoryMode ? '-' : (state.scores?.biru?.babak1 ?? 0);
  const b2Biru = isHistoryMode ? '-' : (state.scores?.biru?.babak2 ?? 0);
  const b3Biru = isHistoryMode ? '-' : (state.scores?.biru?.babak3 ?? 0);
  const jatuhanBiru = isHistoryMode ? '-' : (state.directPoints?.biru ?? 0);

  // Penalties
  const redPen = state.dewanPenalties?.merah || { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false };
  const bluePen = state.dewanPenalties?.biru || { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false };

  let deduksiMerah = 0;
  if (!isHistoryMode) {
    if (redPen.teguran1) deduksiMerah += 1;
    if (redPen.teguran2) deduksiMerah += 2;
    if (redPen.peringatan1) deduksiMerah += 5;
    if (redPen.peringatan2) deduksiMerah += 10;
  }

  let deduksiBiru = 0;
  if (!isHistoryMode) {
    if (bluePen.teguran1) deduksiBiru += 1;
    if (bluePen.teguran2) deduksiBiru += 2;
    if (bluePen.peringatan1) deduksiBiru += 5;
    if (bluePen.peringatan2) deduksiBiru += 10;
  }

  // Helper function to draw page frames & official header
  const drawPageHeader = (pageTitle: string, pageNumber: number) => {
    // Outer official border
    doc.setDrawColor(15, 23, 42); // slate-900
    doc.setLineWidth(0.7);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

    // Inner gold decorative line
    doc.setDrawColor(217, 119, 6); // amber-600
    doc.setLineWidth(0.3);
    doc.rect(9.5, 9.5, pageWidth - 19, pageHeight - 19);

    // Top Header Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(12, 12, pageWidth - 24, 18, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(penyelenggara.toUpperCase(), 16, 17.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(251, 191, 36); // amber-400
    doc.text('LEMBAR REKAPITULASI NILAI AKHIR PERTANDINGAN', 16, 23.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text('FORMULIR RESMI PENETAPAN HASIL & SKOR AKHIR - SISTEM SKORING DIGITAL IPSI', 16, 28);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(pageTitle.toUpperCase(), pageWidth - 16, 17.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`WAKTU CETAK: ${new Date().toLocaleString('id-ID')} WIB`, pageWidth - 16, 23, { align: 'right' });
    doc.text(`HALAMAN ${pageNumber}`, pageWidth - 16, 28, { align: 'right' });
  };

  // --------------------------------------------------------------------------
  // PAGE 1: LEMBAR REKAPITULASI NILAI AKHIR PARTAI
  // --------------------------------------------------------------------------
  drawPageHeader('LEMBAR HASIL RESMI', 1);

  let curY = 34;

  // 1. Metadata Box: Tournament Info & Match Details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(12, curY, pageWidth - 24, 19, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('NAMA EVENT / TURNAMEN :', 16, curY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(eventName.toUpperCase(), 64, curY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('NOMOR PARTAI & GELANGGANG :', 16, curY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6);
  doc.text(`PARTAI ${partaiNum}   |   ${gelanggangName.toUpperCase()}`, 64, curY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('KATEGORI / KELAS / GENDER :', 16, curY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`${kelasName.toUpperCase()}  |  ${genderName.toUpperCase()}  |  3 BABAK RESMI`, 64, curY + 15);

  // Status Badge on Right side
  doc.setFillColor(winnerCorner ? 16 : 71, winnerCorner ? 185 : 85, winnerCorner ? 129 : 105);
  doc.rect(pageWidth - 48, curY + 3.5, 32, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(winnerCorner ? 'PERTANDINGAN SELESAI' : 'LIVE / BERLANGSUNG', pageWidth - 32, curY + 7.8, { align: 'center' });

  curY += 23;

  // 2. Athlete Profile Bar (Merah vs Biru)
  const cardW = (pageWidth - 28) / 2;
  const cardH = 21;

  // Red Corner Card
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.setLineWidth(0.4);
  doc.rect(12, curY, cardW, cardH, 'FD');

  doc.setFillColor(220, 38, 38);
  doc.rect(12, curY, cardW, 4.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SUDUT MERAH (RED CORNER)', 15, curY + 3.3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(atletMerahNama, 15, curY + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(185, 28, 28);
  doc.text(`KONTINGEN: ${atletMerahKontingen}`, 15, curY + 15.5);

  // Total Score Red Badge
  doc.setFillColor(220, 38, 38);
  doc.rect(12 + cardW - 18, curY + 6, 15, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(skorMerahTotal.toString(), 12 + cardW - 10.5, curY + 14, { align: 'center' });

  // Blue Corner Card
  const blueX = 12 + cardW + 4;
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(59, 130, 246);
  doc.rect(blueX, curY, cardW, cardH, 'FD');

  doc.setFillColor(37, 99, 235);
  doc.rect(blueX, curY, cardW, 4.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SUDUT BIRU (BLUE CORNER)', blueX + 3, curY + 3.3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(atletBiruNama, blueX + 3, curY + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(29, 78, 216);
  doc.text(`KONTINGEN: ${atletBiruKontingen}`, blueX + 3, curY + 15.5);

  // Total Score Blue Badge
  doc.setFillColor(37, 99, 235);
  doc.rect(blueX + cardW - 18, curY + 6, 15, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(skorBiruTotal.toString(), blueX + cardW - 10.5, curY + 14, { align: 'center' });

  curY += cardH + 4;

  // 3. Matriks Rekapitulasi Rincian Skor Tiap Babak
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('I. REKAPITULASI NILAI TEKNIK & JATUHAN TIAP BABAK', 12, curY + 3);
  curY += 4.5;

  // Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(12, curY, pageWidth - 24, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Sudut & Identitas Pesilat', 16, curY + 4.5);
  doc.text('Babak I', 80, curY + 4.5, { align: 'center' });
  doc.text('Babak II', 105, curY + 4.5, { align: 'center' });
  doc.text('Babak III', 130, curY + 4.5, { align: 'center' });
  doc.text('Poin Jatuhan (+3)', 158, curY + 4.5, { align: 'center' });
  doc.text('TOTAL TEKNIK', 188, curY + 4.5, { align: 'center' });
  curY += 6.5;

  // Red row
  doc.setFillColor(254, 242, 242);
  doc.rect(12, curY, pageWidth - 24, 6.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(12, curY + 6.5, pageWidth - 12, curY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(220, 38, 38);
  doc.text(`MERAH: ${atletMerahNama} (${atletMerahKontingen})`, 16, curY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(b1Merah.toString(), 80, curY + 4.5, { align: 'center' });
  doc.text(b2Merah.toString(), 105, curY + 4.5, { align: 'center' });
  doc.text(b3Merah.toString(), 130, curY + 4.5, { align: 'center' });
  doc.text(`+${jatuhanMerah}`, 158, curY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text((skorMerahTotal + deduksiMerah).toString(), 188, curY + 4.5, { align: 'center' });
  curY += 6.5;

  // Blue row
  doc.setFillColor(239, 246, 255);
  doc.rect(12, curY, pageWidth - 24, 6.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(12, curY + 6.5, pageWidth - 12, curY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(37, 99, 235);
  doc.text(`BIRU: ${atletBiruNama} (${atletBiruKontingen})`, 16, curY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(b1Biru.toString(), 80, curY + 4.5, { align: 'center' });
  doc.text(b2Biru.toString(), 105, curY + 4.5, { align: 'center' });
  doc.text(b3Biru.toString(), 130, curY + 4.5, { align: 'center' });
  doc.text(`+${jatuhanBiru}`, 158, curY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text((skorBiruTotal + deduksiBiru).toString(), 188, curY + 4.5, { align: 'center' });
  curY += 9;

  // 4. Rincian Hukuman & Sanksi Dewan Hakim
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('II. REKAPITULASI HUKUMAN & DEDUKSI SANKSI DEWAN HAKIM', 12, curY + 3);
  curY += 4.5;

  // Penalty Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(12, curY, pageWidth - 24, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('Sudut Atlet', 16, curY + 4.5);
  doc.text('Binaan I / II', 60, curY + 4.5, { align: 'center' });
  doc.text('Teguran I (-1)', 88, curY + 4.5, { align: 'center' });
  doc.text('Teguran II (-2)', 114, curY + 4.5, { align: 'center' });
  doc.text('Peringatan I (-5)', 140, curY + 4.5, { align: 'center' });
  doc.text('Peringatan II (-10)', 166, curY + 4.5, { align: 'center' });
  doc.text('TOTAL DEDUKSI', 188, curY + 4.5, { align: 'center' });
  curY += 6.5;

  // Penalty Red Row
  doc.setFillColor(255, 255, 255);
  doc.rect(12, curY, pageWidth - 24, 6, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(12, curY + 6, pageWidth - 12, curY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(220, 38, 38);
  doc.text('SUDUT MERAH', 16, curY + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const binaanMStr = `${redPen.binaan1 ? 'B1' : '-'}${redPen.binaan2 ? ', B2' : ''}`;
  doc.text(binaanMStr, 60, curY + 4.2, { align: 'center' });
  doc.text(redPen.teguran1 ? 'YA (-1)' : '-', 88, curY + 4.2, { align: 'center' });
  doc.text(redPen.teguran2 ? 'YA (-2)' : '-', 114, curY + 4.2, { align: 'center' });
  doc.text(redPen.peringatan1 ? 'YA (-5)' : '-', 140, curY + 4.2, { align: 'center' });
  doc.text(redPen.peringatan2 ? 'YA (-10)' : '-', 166, curY + 4.2, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(deduksiMerah > 0 ? `-${deduksiMerah}` : '0', 188, curY + 4.2, { align: 'center' });
  curY += 6;

  // Penalty Blue Row
  doc.setFillColor(248, 250, 252);
  doc.rect(12, curY, pageWidth - 24, 6, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(12, curY + 6, pageWidth - 12, curY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(37, 99, 235);
  doc.text('SUDUT BIRU', 16, curY + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const binaanBStr = `${bluePen.binaan1 ? 'B1' : '-'}${bluePen.binaan2 ? ', B2' : ''}`;
  doc.text(binaanBStr, 60, curY + 4.2, { align: 'center' });
  doc.text(bluePen.teguran1 ? 'YA (-1)' : '-', 88, curY + 4.2, { align: 'center' });
  doc.text(bluePen.teguran2 ? 'YA (-2)' : '-', 114, curY + 4.2, { align: 'center' });
  doc.text(bluePen.peringatan1 ? 'YA (-5)' : '-', 140, curY + 4.2, { align: 'center' });
  doc.text(bluePen.peringatan2 ? 'YA (-10)' : '-', 166, curY + 4.2, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(deduksiBiru > 0 ? `-${deduksiBiru}` : '0', 188, curY + 4.2, { align: 'center' });
  curY += 8.5;

  // 5. Total Nilai Akhir & Penetapan Pemenang Resmi Box
  doc.setFillColor(254, 252, 232); // Amber light
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.rect(12, curY, pageWidth - 24, 25, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);
  doc.text('III. KEPUTUSAN RESMI DEWAN PERTANDINGAN & SKOR AKHIR', 16, curY + 5.5);

  // Score comparison line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`SKOR AKHIR :  MERAH  [ ${skorMerahTotal} ]   vs   [ ${skorBiruTotal} ]  BIRU`, 16, curY + 11.5);

  const selisih = Math.abs(skorMerahTotal - skorBiruTotal);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`(Selisih Nilai Bersih: ${selisih} Poin)`, 115, curY + 11.5);

  // Winner Decision Banner
  const isWinnerMerah = winnerCorner === 'merah';
  const isWinnerBiru = winnerCorner === 'biru';

  let winnerTitle = 'PERTANDINGAN BELUM DITETAPKAN / SERI';
  if (isWinnerMerah) winnerTitle = `PEMENANG : SUDUT MERAH (${atletMerahNama} - ${atletMerahKontingen})`;
  if (isWinnerBiru) winnerTitle = `PEMENANG : SUDUT BIRU (${atletBiruNama} - ${atletBiruKontingen})`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  if (isWinnerMerah) doc.setTextColor(220, 38, 38);
  else if (isWinnerBiru) doc.setTextColor(37, 99, 235);
  else doc.setTextColor(71, 85, 105);
  doc.text(winnerTitle, 16, curY + 17.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`STATUS KEMENANGAN :  ${jenisKemenangan.toUpperCase()}`, 16, curY + 22.5);

  curY += 28.5;

  // 6. Catatan Khusus & Validasi
  if (catatanKhusus.trim()) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(12, curY, pageWidth - 24, 11, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('CATATAN KHUSUS / VERIFIKASI DEWAN :', 16, curY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(catatanKhusus, 16, curY + 8.5);

    curY += 13.5;
  }

  // 7. Lembar Pengesahan Resmi 4 Pejabat Pertandingan (Signatures)
  const signSectionY = Math.max(curY + 2, pageHeight - 52);
  const signColWidth = (pageWidth - 24) / 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('IV. PENGESAHAN HASIL RESMI (OFFICIAL SIGNATURES)', 12, signSectionY);

  const signsList = [
    { role: 'Ketua Pertandingan (KP)', name: ketuaPertandinganName || '( ________________________ )' },
    { role: 'Ketua Dewan Wasit Juri', name: dewanName || '( ________________________ )' },
    { role: 'Wasit Panggung', name: wasitName || '( ________________________ )' },
    { role: 'Sekretaris Pertandingan', name: secretaryName || '( ________________________ )' }
  ];

  signsList.forEach((s, idx) => {
    const sX = 12 + idx * signColWidth;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(s.role, sX + signColWidth / 2, signSectionY + 6.5, { align: 'center' });

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(sX + 6, signSectionY + 24, sX + signColWidth - 6, signSectionY + 24);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(s.name, sX + signColWidth / 2, signSectionY + 28.5, { align: 'center' });
  });

  // Footer on Page 1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Dokumen Sah Rekapitulasi Nilai Akhir Pertandingan  |  Dicetak oleh Sistem Skoring Digital IPSI  |  Halaman 1 dari 1`,
    pageWidth / 2,
    pageHeight - 5,
    { align: 'center' }
  );

  // Save the PDF
  const cleanPartai = partaiNum.toString().replace(/[^a-zA-Z0-9]/g, '_');
  const safeEvent = eventName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Rekapitulasi_Nilai_Akhir_Partai_${cleanPartai}_${safeEvent}_${Date.now()}.pdf`;
  doc.save(filename);
}

