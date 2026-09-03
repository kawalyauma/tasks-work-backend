import { describe,expect,it } from 'vitest';
import { hashPassword,verifyPassword,sha256 } from '../src/core/auth/crypto';

describe('authentication crypto',()=>{
  it('hashes and verifies passwords',async()=>{ const hash=await hashPassword('StrongPassword123'); expect(hash).not.toContain('StrongPassword123'); expect(await verifyPassword('StrongPassword123',hash)).toBe(true); expect(await verifyPassword('wrong',hash)).toBe(false); });
  it('creates deterministic SHA-256 hashes',async()=>{ expect(await sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'); });
});
