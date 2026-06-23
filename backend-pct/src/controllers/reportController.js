import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import db from '../models/index.js';
import { computeTeacherPaymentAmounts } from '../utils/paymentCalculations.js';
import path from 'path';
import fs from 'fs';

const Teacher = db.Teacher;
const Activity = db.Activity;
const AppSetting = db.AppSetting;

// --------------------------------------------------------------
// Helper : format nombre sans séparateur
// --------------------------------------------------------------
function formatNumber(value) {
    return Math.round(value).toString();
}

// --------------------------------------------------------------
// Helper : dessiner une ligne horizontale
// --------------------------------------------------------------
function drawSeparator(doc, y, margin = 50, width = 500) {
    doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(margin, y).lineTo(margin + width, y).stroke();
}

// --------------------------------------------------------------
// Helper : titre de section
// --------------------------------------------------------------
function drawSectionTitle(doc, title, y) {
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#1a3e60').text(title, 50, y);
    drawSeparator(doc, y + 15, 50, 500);
    return y + 20;
}

// --------------------------------------------------------------
// 1. FICHE INDIVIDUELLE (PDF) – professionnel
// --------------------------------------------------------------
export const exportTeacherSheet = async (req, res, next) => {
    try {
        const { teacherId } = req.params;
        const teacher = await Teacher.findByPk(teacherId);
        if (!teacher) return res.status(404).json({ success: false, error: 'Enseignant non trouvé' });

        const activities = await Activity.findAll({
            where: { enseignant_id: teacherId, statut: 'Validée' },
            include: [{ model: db.Resource, as: 'resource', attributes: ['titre', 'type'] }],
            order: [['date', 'ASC']]
        });

        const totalHours = activities.reduce((sum, a) => sum + parseFloat(a.heures_calculees), 0);
        const settings = await AppSetting.findAll();
        const quota = parseFloat(settings.find(s => s.key === 'normal_hours_quota')?.value || 240);
        const normales = Math.min(totalHours, quota);
        const complementaires = Math.max(0, totalHours - quota);
        const tauxHoraire = teacher.taux_horaire;
        const montantComplement = complementaires * tauxHoraire;
        const montantTotal = montantComplement;

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=fiche_enseignant_${teacherId}.pdf`);
        doc.pipe(res);

        // ========== LOGO + EN-TÊTE ==========
        const logoPath = path.join(process.cwd(), 'public', 'logo-uvci.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 40, { width: 50 });
        } else {
            doc.rect(50, 40, 40, 40).fill('#1a3e60');
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text('UVCI', 58, 48);
        }
        doc.fillColor('#1a3e60').font('Helvetica-Bold').fontSize(16).text('UNIVERSITÉ VIRTUELLE', 110, 48);
        doc.font('Helvetica').fontSize(10).fillColor('#666666').text('Côte d’Ivoire', 110, 68);
        doc.fillColor('#1a3e60').font('Helvetica-Bold').fontSize(12).text('FICHE INDIVIDUELLE DE L\'ENSEIGNANT', 400, 50, { align: 'right' });
        drawSeparator(doc, 105, 50, 500);
        let currentY = 120;

        // ========== IDENTITÉ ==========
        currentY = drawSectionTitle(doc, 'IDENTITÉ', currentY);
        const colLeft = 50, colRight = 280;
        let lineY = currentY;
        doc.font('Helvetica-Bold').fontSize(10).text('Nom complet :', colLeft, lineY);
        doc.font('Helvetica').text(`${teacher.nom.toUpperCase()} ${teacher.prenom}`, colLeft + 100, lineY);
        lineY += 20;
        doc.font('Helvetica-Bold').fontSize(10).text('Grade :', colLeft, lineY);
        doc.font('Helvetica').text(teacher.grade, colLeft + 100, lineY);
        doc.font('Helvetica-Bold').fontSize(10).text('Département :', colRight, lineY);
        doc.font('Helvetica').text(teacher.departement, colRight + 100, lineY);
        lineY += 20;
        doc.font('Helvetica-Bold').fontSize(10).text('Statut :', colLeft, lineY);
        doc.font('Helvetica').text(teacher.statut, colLeft + 100, lineY);
        doc.font('Helvetica-Bold').fontSize(10).text('Taux horaire :', colRight, lineY);
        doc.font('Helvetica').text(`${formatNumber(tauxHoraire)} FCFA/h`, colRight + 100, lineY);
        lineY += 20;
        doc.font('Helvetica-Bold').fontSize(10).text('Email :', colLeft, lineY);
        doc.font('Helvetica').text(teacher.email, colLeft + 100, lineY);
        doc.font('Helvetica-Bold').fontSize(10).text('Téléphone :', colRight, lineY);
        doc.font('Helvetica').text(teacher.telephone || 'Non renseigné', colRight + 100, lineY);
        currentY = lineY + 30;

        // ========== VOLUME HORAIRE (avec alignement corrigé) ==========
        currentY = drawSectionTitle(doc, 'VOLUME HORAIRE', currentY);
        const col1Label = 50, col1Value = 200;
        const col2Label = 290, col2Value = 470;
        let rowVol = currentY;
        const fontSizeLabel = 8;

        doc.font('Helvetica-Bold').fontSize(fontSizeLabel).text('Heures totales validées :', col1Label, rowVol);
        doc.font('Helvetica').fontSize(fontSizeLabel).text(`${formatNumber(totalHours)} h`, col1Value, rowVol);
        doc.font('Helvetica-Bold').text('Quota annuel :', col2Label, rowVol);
        doc.font('Helvetica').text(`${formatNumber(quota)} h`, col2Value, rowVol);
        rowVol += 16;

        doc.font('Helvetica-Bold').text('Heures normales :', col1Label, rowVol);
        doc.font('Helvetica').text(`${formatNumber(normales)} h`, col1Value, rowVol);
        doc.font('Helvetica-Bold').text('Heures complémentaires :', col2Label, rowVol);
        doc.font('Helvetica').text(`${formatNumber(complementaires)} h`, col2Value, rowVol);
        rowVol += 16;

        doc.font('Helvetica-Bold').text('Montant dû (heures complémentaires) :', col1Label, rowVol);
        doc.font('Helvetica').text(`${formatNumber(montantTotal)} FCFA`, col1Value, rowVol);
        doc.font('Helvetica-Bold').text('Détail :', col2Label, rowVol);
        doc.font('Helvetica').text(`${formatNumber(complementaires)} h × ${formatNumber(tauxHoraire)} FCFA`, col2Value, rowVol);
        rowVol += 16;
        currentY = rowVol + 20;

        // ========== ACTIVITÉS (tableau) ==========
        currentY = drawSectionTitle(doc, 'DÉTAIL DES ACTIVITÉS VALIDÉES', currentY);
        if (activities.length === 0) {
            doc.font('Helvetica').fontSize(10).fillColor('#666666').text('Aucune activité validée pour cet enseignant.', 50, currentY);
        } else {
            const tableTop = currentY;
            const colPos = [50, 180, 260, 330, 400, 470];
            const colWidths = [130, 80, 70, 70, 70, 80];
            const headersAct = ['RESSOURCE', 'TYPE', 'COMPLEXITÉ', 'HEURES', 'DATE', ''];
            for (let i = 0; i < headersAct.length - 1; i++) {
                doc.rect(colPos[i], tableTop, colWidths[i], 25).fill('#e6e9ef').stroke();
                doc.fillColor('#1a3e60').font('Helvetica-Bold').fontSize(9).text(headersAct[i], colPos[i] + 5, tableTop + 7, { width: colWidths[i] - 10, align: 'center' });
            }
            let rowYTable = tableTop + 25;
            for (const act of activities) {
                const row = [
                    act.resource?.titre?.substring(0, 35) || 'Sans titre',
                    act.type,
                    act.complexite,
                    `${formatNumber(act.heures_calculees)} h`,
                    new Date(act.date).toLocaleDateString('fr-FR')
                ];
                for (let i = 0; i < row.length; i++) {
                    doc.rect(colPos[i], rowYTable, colWidths[i], 20).stroke();
                    doc.fillColor('#000000').font('Helvetica').fontSize(9).text(row[i], colPos[i] + 5, rowYTable + 5, { width: colWidths[i] - 10 });
                }
                rowYTable += 20;
                if (rowYTable > 700) {
                    doc.addPage();
                    rowYTable = 50;
                    for (let i = 0; i < headersAct.length - 1; i++) {
                        doc.rect(colPos[i], rowYTable - 25, colWidths[i], 25).fill('#e6e9ef').stroke();
                        doc.fillColor('#1a3e60').font('Helvetica-Bold').fontSize(9).text(headersAct[i], colPos[i] + 5, rowYTable - 18, { width: colWidths[i] - 10, align: 'center' });
                    }
                }
            }
            currentY = rowYTable + 10;
        }

        // Pied de page
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            drawSeparator(doc, doc.page.height - 50, 50, 500);
            doc.fontSize(8).fillColor('#999999').text(
                `Document généré le ${new Date().toLocaleDateString('fr-FR')} - Page ${i+1} sur ${pageCount}`,
                50, doc.page.height - 35, { align: 'center' }
            );
        }
        doc.end();
    } catch (error) {
        console.error(error);
        next(error);
    }
};

// --------------------------------------------------------------
// 2. EXPORT GLOBAL DES HEURES (Excel) – charte UVCI
// --------------------------------------------------------------
export const exportGlobalHours = async (req, res, next) => {
    try {
        const teachers = await Teacher.findAll({
            include: [{
                model: Activity,
                as: 'activities',
                where: { statut: 'Validée' },
                required: false
            }]
        });
        const settings = await AppSetting.findAll();
        const quota = parseFloat(settings.find(s => s.key === 'normal_hours_quota')?.value || 240);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'UVCI';
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet('Heures enseignants');

        // ========== TITRE ==========
        worksheet.mergeCells('A1:G1');
        worksheet.getCell('A1').value = 'ÉTAT GLOBAL DES HEURES – ENSEIGNANTS';
        worksheet.getCell('A1').font = { name: 'Helvetica', size: 14, bold: true, color: { argb: 'FF1a3e60' } };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 30;

        // ========== DATE ==========
        worksheet.mergeCells('A2:G2');
        worksheet.getCell('A2').value = `Document généré le ${new Date().toLocaleDateString('fr-FR')}`;
        worksheet.getCell('A2').font = { name: 'Helvetica', size: 10, italic: true, color: { argb: 'FF666666' } };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
        worksheet.getRow(2).height = 20;

        // ========== EN‑TÊTES DE COLONNES (avec retour à la ligne) ==========
        const headers = [
            'Nom',
            'Prénom',
            'Grade',
            'Département',
            'Heures\nnormales',
            'Heures\ncomplémentaires',
            'Heures\ntotales'
        ];
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell, colNumber) => {
            cell.font = { name: 'Helvetica', bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3e60' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        worksheet.getRow(3).height = 40;

        // ========== DONNÉES ==========
        for (const teacher of teachers) {
            const total = teacher.activities.reduce((s, a) => s + parseFloat(a.heures_calculees), 0);
            const normales = Math.min(total, quota);
            const complementaires = Math.max(0, total - quota);
            worksheet.addRow([
                teacher.nom,
                teacher.prenom,
                teacher.grade,
                teacher.departement,
                normales,
                complementaires,
                total
            ]);
        }

        // ========== FORMATAGE DES LIGNES DE DONNÉES ==========
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 3) return;
            row.eachCell(cell => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { vertical: 'middle' };
                // Aligner les nombres à droite (colonnes 5,6,7)
                if (cell.col >= 5 && cell.col <= 7) {
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                } else {
                    cell.alignment = { horizontal: 'left', vertical: 'middle' };
                }
            });
        });

        // ========== LARGEURS DES COLONNES ==========
        const columnWidths = {
            'Nom': 18,
            'Prénom': 18,
            'Grade': 16,
            'Département': 25,
            'Heures\nnormales': 16,
            'Heures\ncomplémentaires': 20,
            'Heures\ntotales': 16
        };
        worksheet.columns.forEach((col, idx) => {
            const headerText = headers[idx];
            col.width = columnWidths[headerText] || 15;
        });

        // ========== ENVOI ==========
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=etat_heures_enseignants_pro.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) { next(error); }
};
// --------------------------------------------------------------
// 3. EXPORT DES PAIEMENTS (Excel) – charte UVCI
// --------------------------------------------------------------
export const exportPayment = async (req, res, next) => {
    try {
        const teachers = await Teacher.findAll();

        // Récupérer l'année académique active
        let activeYear = await db.AcademicYear.findOne({ where: { is_active: true } });
        if (!activeYear) {
            console.warn('Aucune année académique active. Les paiements ne seront pas associés à une année.');
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'UVCI';
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet('Paiements');

        // ========== TITRE ==========
        worksheet.mergeCells('A1:G1');
        worksheet.getCell('A1').value = 'ÉTAT DES PAIEMENTS – DÉTAIL HEURES';
        worksheet.getCell('A1').font = { name: 'Helvetica', size: 14, bold: true, color: { argb: 'FF1a3e60' } };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 30;

        // ========== DATE ==========
        worksheet.mergeCells('A2:G2');
        worksheet.getCell('A2').value = `Document généré le ${new Date().toLocaleDateString('fr-FR')}`;
        worksheet.getCell('A2').font = { name: 'Helvetica', size: 10, italic: true, color: { argb: 'FF666666' } };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
        worksheet.getRow(2).height = 20;

        // ========== EN‑TÊTES DE COLONNES (avec retour à la ligne) ==========
        const headers = [
            'Nom',
            'Prénom',
            'Taux horaire\n(FCFA)',
            'Heures\nnormales',
            'Heures\ncomplémentaires',
            'Montant heures\ncomplémentaires (FCFA)',
            'Montant total\nà payer (FCFA)'
        ];
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell, colNumber) => {
            cell.font = { name: 'Helvetica', bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3e60' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        worksheet.getRow(3).height = 40;

        // ========== DONNÉES (export lecture seule — pas d'écriture en base) ==========
        for (const teacher of teachers) {
            const amounts = await computeTeacherPaymentAmounts(db, {
                teacherId: teacher.id,
                academicYearId: activeYear?.id ?? null,
                tauxHoraire: teacher.taux_horaire,
            });

            worksheet.addRow([
                teacher.nom,
                teacher.prenom,
                parseFloat(teacher.taux_horaire),
                amounts.heuresNormales,
                amounts.heuresComplementaires,
                amounts.montantTotal,
                amounts.montantTotal,
            ]);
        }

        // ========== FORMATAGE DES LIGNES DE DONNÉES ==========
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 3) return;
            row.eachCell(cell => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { vertical: 'middle' };
                if ([3, 4, 5, 6, 7].includes(cell.col)) {
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                } else {
                    cell.alignment = { horizontal: 'left', vertical: 'middle' };
                }
            });
        });

        // ========== LARGEURS DES COLONNES ==========
        const columnWidths = {
            'Nom': 18,
            'Prénom': 18,
            'Taux horaire\n(FCFA)': 16,
            'Heures\nnormales': 14,
            'Heures\ncomplémentaires': 16,
            'Montant heures\ncomplémentaires (FCFA)': 24,
            'Montant total\nà payer (FCFA)': 22
        };
        worksheet.columns.forEach((col, idx) => {
            const headerText = headers[idx];
            col.width = columnWidths[headerText] || 15;
        });

        // ========== ENVOI DU FICHIER ==========
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=etat_paiements_detail_pro.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('[exportPayment] Erreur :', error);
        next(error);
    }
};