const bcrypt = require('bcrypt');

async function generateHashes() {
    const adminHash = await bcrypt.hash('admin123', 10);
    const vendedorHash = await bcrypt.hash('vendedor123', 10);

    console.log('\n=== COPIE E EXECUTE NO SEU BANCO DE DADOS ===\n');
    console.log(`UPDATE users SET password = '${adminHash}' WHERE username = 'admin';`);
    console.log(`UPDATE users SET password = '${vendedorHash}' WHERE username = 'vendedor1';`);
    console.log('\n===========================================\n');
}

generateHashes();
