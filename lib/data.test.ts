import { describe, it, expect } from 'vitest';
import { institutions, institutionsByKode, searchInstitutions, seedsMeta, scholarships } from './data';

describe('katalog institusi', () => {
  it('memuat seluruh kampus dari seed', () => {
    expect(institutions.length).toBe(seedsMeta.institutions.count);
    expect(institutions.length).toBeGreaterThan(3600);
  });

  it('UIN Jakarta ada, lengkap dengan UKT terpasang', () => {
    const uin = institutionsByKode.get('201001')!;
    expect(uin).toBeDefined();
    expect(uin.nama).toContain('SYARIF HIDAYATULLAH');
    expect(uin.ukt).not.toBeNull();
    expect(uin.ukt!.prodi.length).toBeGreaterThan(40);
  });

  it('kampus tanpa data UKT ditandai null, bukan diisi data palsu', () => {
    const tanpaUkt = institutions.filter((i) => !i.ukt);
    expect(tanpaUkt.length).toBeGreaterThan(0);
    for (const i of tanpaUkt) expect(i.ukt).toBeNull();
  });

  it('jenis kampus terklasifikasi', () => {
    const jenis = new Set(institutions.map((i) => i.jenis));
    for (const j of ['UNIVERSITAS', 'POLITEKNIK', 'SEKOLAH TINGGI', 'INSTITUT', 'AKADEMI']) {
      expect(jenis.has(j)).toBe(true);
    }
  });
});

describe('searchInstitutions', () => {
  it('menemukan kampus dari potongan nama', () => {
    const hasil = searchInstitutions('syarif hidayatullah');
    expect(hasil[0]?.kode).toBe('201001');
  });

  it('tahan terhadap urutan kata yang berbeda', () => {
    const hasil = searchInstitutions('kalijaga sunan');
    expect(hasil.some((i) => i.kode === '201002')).toBe(true);
  });

  it('menghormati filter jenis', () => {
    const hasil = searchInstitutions('negeri', { jenis: 'POLITEKNIK', limit: 20 });
    expect(hasil.length).toBeGreaterThan(0);
    expect(hasil.every((i) => i.jenis === 'POLITEKNIK')).toBe(true);
  });

  it('query kosong mengembalikan array kosong, bukan seluruh katalog', () => {
    expect(searchInstitutions('')).toEqual([]);
  });

  it('menghormati batas hasil', () => {
    expect(searchInstitutions('universitas', { limit: 5 }).length).toBeLessThanOrEqual(5);
  });
});

describe('seed beasiswa', () => {
  it('setiap beasiswa punya sumber dan tanggal verifikasi', () => {
    expect(scholarships.length).toBeGreaterThan(5);
    for (const s of scholarships) {
      expect(s.source_url, s.slug).toMatch(/^https:\/\//);
      expect(Number.isFinite(Date.parse(s.last_verified_at)), s.slug).toBe(true);
      expect(s.confidence, s.slug).toBeGreaterThan(0);
      expect(s.confidence, s.slug).toBeLessThanOrEqual(100);
    }
  });

  it('beasiswa nasional TIDAK memakai nomor golongan sebagai syarat UKT', () => {
    // Aturan §5: nomor golongan hanya sah untuk beasiswa yang terikat satu kampus.
    const pelanggar = scholarships.filter(
      (s) => s.scope === 'nasional' && s.ukt_max_golongan !== undefined,
    );
    expect(pelanggar.map((s) => s.slug)).toEqual([]);
  });

  it('setiap beasiswa kampus menyebut kode kampusnya di scope', () => {
    const kampusScope = scholarships.filter((s) => s.scope.startsWith('kampus:'));
    expect(kampusScope.length).toBeGreaterThan(0);
    for (const s of kampusScope) {
      const kode = s.scope.split(':')[1];
      expect(institutionsByKode.has(kode), `${s.slug} -> ${kode}`).toBe(true);
    }
  });
});