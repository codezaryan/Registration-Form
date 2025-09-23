import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';

const adminDataFile = path.join(process.cwd(), 'src/data/admins.json');

export interface AdminData {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'superadmin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class AdminModel {
  private async ensureAdminFile(): Promise<void> {
    try {
      await fs.access(adminDataFile);
    } catch {
      // Create data directory if it doesn't exist
      const dataDir = path.dirname(adminDataFile);
      await fs.mkdir(dataDir, { recursive: true });

      // Create default admin
      const defaultAdmin: AdminData = {
        id: 1,
        username: 'admin',
        password: await bcrypt.hash('admin123', 12),
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await fs.writeFile(adminDataFile, JSON.stringify([defaultAdmin], null, 2), 'utf-8');
      console.log('📁 Created new admins data file with default admin');
    }
  }

  async findByUsername(username: string): Promise<AdminData | null> {
    await this.ensureAdminFile();
    try {
      const content = await fs.readFile(adminDataFile, 'utf-8');
      const admins: AdminData[] = JSON.parse(content);
      return admins.find(admin => admin.username === username && admin.isActive) || null;
    } catch {
      return null;
    }
  }

  async findById(id: number): Promise<AdminData | null> {
    await this.ensureAdminFile();
    try {
      const content = await fs.readFile(adminDataFile, 'utf-8');
      const admins: AdminData[] = JSON.parse(content);
      return admins.find(admin => admin.id === id && admin.isActive) || null;
    } catch {
      return null;
    }
  }

  async create(adminData: Omit<AdminData, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdminData> {
    await this.ensureAdminFile();
    const content = await fs.readFile(adminDataFile, 'utf-8');
    const admins: AdminData[] = JSON.parse(content);

    const newId = admins.length > 0 ? Math.max(...admins.map(a => a.id)) + 1 : 1;

    const newAdmin: AdminData = {
      id: newId,
      ...adminData,
      password: await bcrypt.hash(adminData.password, 12),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    admins.push(newAdmin);
    await fs.writeFile(adminDataFile, JSON.stringify(admins, null, 2), 'utf-8');

    return newAdmin;
  }

  async update(id: number, updates: Partial<Omit<AdminData, 'id' | 'createdAt'>>): Promise<AdminData | null> {
    await this.ensureAdminFile();
    const content = await fs.readFile(adminDataFile, 'utf-8');
    const admins: AdminData[] = JSON.parse(content);

    const index = admins.findIndex(admin => admin.id === id);
    if (index === -1) return null;

    const existingAdmin = admins[index];
    if (!existingAdmin) return null;

    const updatedAdmin: AdminData = {
      id: existingAdmin.id,
      username: existingAdmin.username,
      password: existingAdmin.password,
      role: existingAdmin.role,
      isActive: existingAdmin.isActive,
      createdAt: existingAdmin.createdAt,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    admins[index] = updatedAdmin;

    await fs.writeFile(adminDataFile, JSON.stringify(admins, null, 2), 'utf-8');
    return admins[index] || null;
  }

  async delete(id: number): Promise<boolean> {
    await this.ensureAdminFile();
    const content = await fs.readFile(adminDataFile, 'utf-8');
    const admins: AdminData[] = JSON.parse(content);

    const filteredAdmins = admins.filter(admin => admin.id !== id);
    if (filteredAdmins.length === admins.length) return false;

    await fs.writeFile(adminDataFile, JSON.stringify(filteredAdmins, null, 2), 'utf-8');
    return true;
  }
}

export const Admin = new AdminModel();
