import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'src/data');
const dataFile = path.join(dataDir, 'registrations.json');

export interface RegistrationData {
  id: number;
  fullName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  mobileNumber: string;
  email: string;
  aadhaarNumber: string;
  panNumber: string;
  permanentAddress: string;
  state: string;
  city: string;
  pincode: string;
  photoUrl: string;
  videoUrl: string;
  createdAt: string;
  updatedAt: string;
}

class JSONStorage {
  private async ensureDataFile(): Promise<void> {
    try {
      await fs.access(dataFile);
    } catch {
      // Create data directory if it doesn't exist
      await fs.mkdir(dataDir, { recursive: true });
      // Create empty JSON array
      await fs.writeFile(dataFile, JSON.stringify([], null, 2), 'utf-8');
      console.log('📁 Created new registrations data file');
    }
  }

  async create(data: Omit<RegistrationData, 'id' | 'createdAt' | 'updatedAt'>): Promise<RegistrationData> {
    await this.ensureDataFile();
    
    const existingData = await this.readData();
    const newId = existingData.length > 0 ? Math.max(...existingData.map(r => r.id)) + 1 : 1;
    
    const newRegistration: RegistrationData = {
      id: newId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    existingData.push(newRegistration);
    await this.writeData(existingData);
    
    return newRegistration;
  }

  async findAll(filters?: any): Promise<RegistrationData[]> {
    await this.ensureDataFile();
    let data = await this.readData();
    
    // Apply filters
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      data = data.filter(r => 
        r.fullName.toLowerCase().includes(search) ||
        r.mobileNumber.includes(search) ||
        r.aadhaarNumber.includes(search)
      );
    }
    if (filters?.state) data = data.filter(r => r.state === filters.state);
    if (filters?.city) data = data.filter(r => r.city === filters.city);
    if (filters?.gender) data = data.filter(r => r.gender === filters.gender);
    
    // Sort by latest first
    return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findById(id: number): Promise<RegistrationData | null> {
    const data = await this.findAll();
    return data.find(r => r.id === id) || null;
  }

  async update(id: number, updates: Partial<Omit<RegistrationData, 'id' | 'createdAt'>>): Promise<RegistrationData | null> {
    const data = await this.readData();
    const index = data.findIndex(r => r.id === id);

    if (index === -1) return null;

    const existingRegistration = data[index];
    if (!existingRegistration) return null;

    const updatedRegistration: RegistrationData = {
      id: existingRegistration.id,
      fullName: existingRegistration.fullName,
      dateOfBirth: existingRegistration.dateOfBirth,
      gender: existingRegistration.gender,
      mobileNumber: existingRegistration.mobileNumber,
      email: existingRegistration.email,
      aadhaarNumber: existingRegistration.aadhaarNumber,
      panNumber: existingRegistration.panNumber,
      permanentAddress: existingRegistration.permanentAddress,
      state: existingRegistration.state,
      city: existingRegistration.city,
      pincode: existingRegistration.pincode,
      photoUrl: existingRegistration.photoUrl,
      videoUrl: existingRegistration.videoUrl,
      createdAt: existingRegistration.createdAt,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    data[index] = updatedRegistration;
    await this.writeData(data);
    return data[index] || null;
  }

  async delete(id: number): Promise<boolean> {
    const data = await this.readData();
    const initialLength = data.length;
    const filteredData = data.filter(r => r.id !== id);
    
    if (filteredData.length === initialLength) return false;
    
    await this.writeData(filteredData);
    return true;
  }

  async getStats() {
    const data = await this.findAll();
    const total = data.length;
    const byGender = data.reduce((acc, r) => {
      acc[r.gender] = (acc[r.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, byGender };
  }

  private async readData(): Promise<RegistrationData[]> {
    try {
      const content = await fs.readFile(dataFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  private async writeData(data: RegistrationData[]): Promise<void> {
    await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf-8');
  }
}

export const storage = new JSONStorage();