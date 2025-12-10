import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Credenciais hardcoded para funcionamento imediato
const SERVICE_ACCOUNT_CREDENTIALS = {
  type: "service_account",
  project_id: "dashboardkpi-469423",
  private_key_id: "fb574ee43bcc0ff52641c1337770e4300f668896",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC4ad/goHEIlqlu\nTU6WH9YUOSprx723egKygiDPZM69ehFO9l/P2URO6HeMXkj89ThnjfPlb8SAkVYm\nsQmL2y6R3gT+Cny/69eHBa/2fxDIx0fjEbKLOcaAWL8C0yOLQ7thg08zYtM+sEB+\n0cLkAqidv5tJPGhwsS83Gv89s7Zomgcdu6VyG3ud8gGADRVOk4911Aqo/OMMur6+\nmoDrHzFP+c03Q5H2m6niWC4MNFjZT9Qk4ZKRlmVI3PYeKfoyZ9Zvp/j8H5WSwuT4\nLBQXYb5SvOz+XMhWwFYjQ/HKj8TyfybwaqouYzjCb5VeW3AefWyM1av2NaEKI1Xl\nb4oE9m5vAgMBAAECggEABvsKHJCH+mFcR9lh9re2A9RneFhPzyUtiS7ADTKYPNQd\n9g46HD3xvv/N9AQuGgDAiUhLwqJhrQ2MOaLwZQOqMtgAFtKX6oU8zawwqcM9yxL4\nEG6w9EXF73p6vdqFTnmvxc1Ki6aikuLM3jHbnbzQ6kbdDLhQHDaak7cXWFTp9Q6D\ne+DjBXSecBQtMZ7WcsER9P12DCF3Kw41xI315k59itQqDwYLvXPCtdJMh2RYYoDm\nyKGf29Cq+JX7fErZ6jDeWh8nIhu59sjfvZtWITVCe1UOkO3He5Bm54TbZBX+UzWO\n6cLEmFObpTKkmSs09iXaCCfJWn/ZWLbwBkkNvsR9yQKBgQDtuHQwOFlg7BdjE7bx\nou22i1lKovkuAm/wom489VeRH11KUPEerRsUJpsgjz57woyzBinXEsSwiDRfmis+\nZgnzO8qbBSfdyoSDqo6adxprvytM1y32ii06d7QjrqDqPipGyCq7CatRlqv2tJBJ\nPrvCEVk8AtHdM+m4PdGG4cl87QKBgQDGmBHDBWVg912rV+Ozwlqu+pGkycPv695S\nONHmwqLHQXwwYgRtFBmANYRrsJTihDWfHC0PA4dn6oOXan6Ukaka+VMqK0c8+aH5\n8gpKhnCnpmLd1G6Vwy85z5EEsV/yQenc5BJgrkzWRGuppOUQGbmBr5JXkUz2supA\nqnnD6OSJSwKBgBZGa3S9QvrHBKX/Cex4hOfPBO3ueYTrK4wT3FqP7sWld7tn/EAQ\nnnHz8CNL6OH15/M6h58knhOgn6+5pYWyUApftutxvzuUJ3ii+bvVnz8raaZIn4Dz\nj6tj3hhd26w3aQS66u4dyNTbVn/GiaKjYzqbH451AS9GFwdxm3mVHKk9AoGAQGSa\njcO4JYLPynkLCgRg5w+0HdyWPbsbMUnfNZWyti0TmZSOnte/lQTFVS3CeNgpktfN\n/GpGg3lVBcmwFXhNfsONJcU2qhy/Wo4SrCt/Z7zZndf9q23IaFRXT1A8Lg8VR1xk\nYRjjLS6uQimHZHsS3WwSZXZloDBPKHyeUtm3EJUCgYEAm8vlSHOhX3Bp1mwYbtiP\nlMVmrBEnQ0RCa8w7QZH70Su33DlHNdnr7SBghYDFkfbtMbg7Pf+SZrw9Ru3LEooX\nuUBujpH0bA/+2RlGFmIIPpmGXAOxHsJy6fxWcfE0f6eVgMBksfo9Czdu8+DCm9Zu\n0ZArthtgdHBx0JN8K04SMyE=\n-----END PRIVATE KEY-----\n",
  client_email: "editor-dashboard-okr@dashboardkpi-469423.iam.gserviceaccount.com",
  client_id: "103725442619752794777",
};

const SPREADSHEET_ID = '1saWDiU5tILtSheGgykJEz-xR0pmemz29256Y7pfZvSs';

// Configuração do Service Account
const getAuthClient = async () => {
  const auth = new google.auth.GoogleAuth({
    credentials: SERVICE_ACCOUNT_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  return auth;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates, sheetName } = body;


    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Dados de atualização inválidos' },
        { status: 400 }
      );
    }

    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Preparar dados para batch update
    // Coluna H = META, Coluna I = REALIZADO, Coluna M = MEDIDA, Coluna N = FORMA DE MEDIR, Coluna P = RESPONSÁVEL
    const data = updates.map((update: { rowIndex: number; meta: string; realizado: string; formaDeMedir?: string; responsavel?: string; medida?: string }) => {
      const updateData = [
        {
          range: `'${sheetName || 'NOVO PAINEL OKR'}'!H${update.rowIndex}`,
          values: [[update.meta]],
        },
        {
          range: `'${sheetName || 'NOVO PAINEL OKR'}'!I${update.rowIndex}`,
          values: [[update.realizado]],
        },
      ];
      
      // Adicionar medida se existir (Coluna M)
      if (update.medida) {
        updateData.push({
          range: `'${sheetName || 'NOVO PAINEL OKR'}'!M${update.rowIndex}`,
          values: [[update.medida]],
        });
      }
      
      // Adicionar forma de medir se existir (Coluna N)
      if (update.formaDeMedir) {
        updateData.push({
          range: `'${sheetName || 'NOVO PAINEL OKR'}'!N${update.rowIndex}`,
          values: [[update.formaDeMedir]],
        });
      }
      
      // Adicionar responsável se existir (Coluna P)
      if (update.responsavel) {
        updateData.push({
          range: `'${sheetName || 'NOVO PAINEL OKR'}'!P${update.rowIndex}`,
          values: [[update.responsavel]],
        });
      }
      
      return updateData;
    }).flat();

    // Executar batch update
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data,
      },
    });

    return NextResponse.json({ success: true, message: 'Dados salvos com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar dados na planilha', details: String(error) },
      { status: 500 }
    );
  }
}
