#!/bin/bash
# Script para criar usuário admin no Docker MongoDB

echo "🔧 Criando usuário administrador no Docker..."

docker-compose exec -T server node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/wayfin');
    console.log('✅ Conectado ao MongoDB');
    
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }
    }));
    
    const Profile = mongoose.model('Profile', new mongoose.Schema({
      name: String,
      permissions: Object,
      isStatic: Boolean
    }));
    
    const adminProfile = await Profile.findOne({ name: 'Administrador' });
    if (!adminProfile) {
      console.log('❌ Perfil Admin não encontrado');
      process.exit(1);
    }
    
    const existingAdmin = await User.findOne({ email: 'admin@wayfin.com' });
    if (existingAdmin) {
      console.log('✅ Usuário admin já existe');
      console.log('');
      console.log('═══════════════════════════════════════');
      console.log('  📧 Email: admin@wayfin.com');
      console.log('  🔑 Senha: admin123');
      console.log('═══════════════════════════════════════');
      process.exit(0);
    }
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Administrador',
      email: 'admin@wayfin.com',
      password: hashedPassword,
      profile: adminProfile._id
    });
    
    console.log('✅ Usuário admin criado com sucesso!');
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('  📧 Email: admin@wayfin.com');
    console.log('  🔑 Senha: admin123');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('⚠️  IMPORTANTE: Seus dados locais não foram migrados.');
    console.log('   Para migrar, você precisará exportar do MongoDB local');
    console.log('   e importar para o Docker manualmente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

createAdmin();
"

echo ""
echo "✅ Pronto! Acesse http://localhost:8080"
