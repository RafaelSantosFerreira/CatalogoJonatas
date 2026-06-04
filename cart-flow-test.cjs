const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3099';
const SHOTS = path.join(process.env.TEMP || 'C:/tmp', 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

async function shot(page, name) {
  const p = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`  screenshot -> ${p}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  // ── 1. Catálogo ──────────────────────────────────────────────────
  console.log('\n[1] Abrindo catálogo...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await shot(page, '01-catalogo');

  // ── 2. Clicar "Adicionar" em "Prego 20x42" (sem variantes) ───────
  console.log('[2] Buscando card do Prego 20x42...');
  // Procura o botão Adicionar próximo ao texto "Prego 20x42"
  const pregoCard = page.locator('article, [class*="card"]').filter({ hasText: /prego 20x42/i }).first();
  let addBtn;
  if (await pregoCard.count() > 0) {
    addBtn = pregoCard.getByRole('button', { name: /adicionar/i });
    console.log('  Card encontrado por "article"');
  } else {
    // Fallback: busca pelo 3º botão Adicionar (índice 2 = Prego)
    addBtn = page.getByRole('button', { name: /adicionar/i }).nth(2);
    console.log('  Usando botão Adicionar nth(2)');
  }
  await addBtn.click();
  await page.waitForTimeout(800);
  await shot(page, '02-primeiro-clique');

  // ── 3. Se abriu modal de cliente, preencher ───────────────────────
  const nomeInput = page.getByPlaceholder(/nome completo|nome/i).first();
  if (await nomeInput.isVisible().catch(() => false)) {
    console.log('[3] Preenchendo cadastro do cliente...');
    await nomeInput.fill('Carlos Ferreira');
    // Telefone: último input visível
    const inputs = await page.locator('input').all();
    for (let i = inputs.length - 1; i >= 0; i--) {
      if (await inputs[i].isVisible().catch(() => false)) {
        const v = await inputs[i].inputValue();
        if (!v.includes('Carlos')) { await inputs[i].fill('5399654477'); break; }
      }
    }
    await shot(page, '03-formulario-cliente');
    await page.getByRole('button', { name: /continuar|confirmar|salvar/i }).last().click();
    await page.waitForTimeout(1500);
    await shot(page, '04-apos-cadastro');

    // Clicar Adicionar novamente após cadastro
    console.log('[3b] Adicionando produto após cadastro...');
    if (await pregoCard.count() > 0) {
      await pregoCard.getByRole('button', { name: /adicionar/i }).click();
    } else {
      await page.getByRole('button', { name: /adicionar/i }).nth(2).click();
    }
    await page.waitForTimeout(800);
    await shot(page, '04b-apos-segundo-clique');
  }

  // ── 4. Se abriu modal/popover de atributos, confirmar ────────────
  // O modal pode não ter role="dialog" — procura botão "Adicionar" overlay
  await page.waitForTimeout(500);
  const overlayAdd = page.locator('div[class*="fixed"], div[class*="absolute"], [data-radix-popper-content-wrapper]')
    .getByRole('button', { name: /^adicionar$/i }).last();
  if (await overlayAdd.isVisible().catch(() => false)) {
    console.log('[4] Confirmando no modal/overlay...');
    await overlayAdd.click();
    await page.waitForTimeout(1000);
  } else {
    // Fallback: clica no último botão "Adicionar" da página (o do modal)
    const allAddBtns = page.getByRole('button', { name: /^adicionar$/i });
    const total = await allAddBtns.count();
    console.log(`[4] Fallback: ${total} botões "Adicionar" — clicando no último...`);
    if (total > 0) {
      await allAddBtns.last().click({ force: true });
      await page.waitForTimeout(1000);
    }
  }
  await shot(page, '05-item-adicionado');

  // ── 5. Abrir drawer do carrinho ───────────────────────────────────
  console.log('[5] Abrindo carrinho...');
  await page.getByRole('button', { name: /carrinho/i }).first().click();
  await page.waitForTimeout(800);
  await shot(page, '06-carrinho-drawer');

  // ── 6. Enviar Pedido ──────────────────────────────────────────────
  console.log('[6] Enviando pedido...');
  // Botão "Enviar Pedido" no CartDrawer
  const enviarBtn = page.getByRole('button', { name: /enviar pedido|finalizar pedido|enviar/i }).last();
  if (await enviarBtn.isVisible().catch(() => false)) {
    await enviarBtn.click();
    console.log('  Pedido enviado! Aguardando WhatsApp...');
    await page.waitForTimeout(5000);
    await shot(page, '07-confirmacao');
  } else {
    const btns = await page.getByRole('button').allTextContents();
    console.log('  Botões visíveis:', btns.filter(t => t.trim()).join(' | '));
    await shot(page, '07-sem-enviar');
  }

  await shot(page, '08-final');

  const relevantErrors = errors.filter(e => !e.includes('getServerSnapshot'));
  console.log('\nErros relevantes:', relevantErrors.length ? relevantErrors.join('\n  ') : 'nenhum');
  await browser.close();
}

run().catch(e => { console.error('ERRO FATAL:', e.message); process.exit(1); });
