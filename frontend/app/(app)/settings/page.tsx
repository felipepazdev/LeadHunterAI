'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Mail, Lock, Trash2, Shield, Save, AlertTriangle } from 'lucide-react';
import { api } from '@/services/api';
import { getSession, clearSession, saveSession } from '@/services/auth';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');

  /* ── Perfil ── */
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [profileOk, setProfileOk] = useState('');
  const [profileErr, setProfileErr] = useState('');

  /* ── Senha ── */
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [savingPwd,  setSavingPwd]  = useState(false);
  const [pwdOk,      setPwdOk]      = useState('');
  const [pwdErr,     setPwdErr]     = useState('');

  /* ── Conta ── */
  const [deletingAcc,  setDeletingAcc]  = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');
  const [deleteModal,   setDeleteModal]  = useState(false);

  const load = useCallback(async () => {
    const { user } = getSession();
    if (!user) return;
    setUserId(user.id);
    setName(user.name);
    setEmail(user.email);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Salvar perfil ── */
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileOk(''); setProfileErr('');
    if (!name.trim() || !email.trim()) { setProfileErr('Nome e e-mail são obrigatórios'); return; }
    setSaving(true);
    try {
      const res = await api.users.update(userId, { name, email });
      // Atualiza sessão local
      const { user } = getSession();
      if (user) saveSession(localStorage.getItem('leadhunter_token')!, { ...user, name: res.user.name, email: res.user.email });
      setProfileOk('Perfil atualizado com sucesso!');
    } catch (e: unknown) {
      setProfileErr(e instanceof Error ? e.message : 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  }

  /* ── Salvar senha ── */
  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdOk(''); setPwdErr('');
    if (!newPwd || !confirmPwd) { setPwdErr('Preencha todos os campos'); return; }
    if (newPwd.length < 6)      { setPwdErr('Senha deve ter ao menos 6 caracteres'); return; }
    if (newPwd !== confirmPwd)  { setPwdErr('As senhas não coincidem'); return; }
    setSavingPwd(true);
    try {
      await api.users.update(userId, { password: newPwd });
      setPwdOk('Senha alterada com sucesso!');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (e: unknown) {
      setPwdErr(e instanceof Error ? e.message : 'Erro ao alterar senha');
    } finally {
      setSavingPwd(false);
    }
  }

  /* ── Deletar conta ── */
  async function handleDeleteAccount() {
    if (confirmDelete !== email) { return; }
    setDeletingAcc(true);
    try {
      await api.users.delete(userId);
      clearSession();
      router.push('/login');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erro ao remover conta');
    } finally {
      setDeletingAcc(false);
    }
  }

  const inputPwd = (label: string, val: string, set: (v: string) => void, placeholder: string) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="input-with-icon">
        <Lock size={15} className="input-icon" />
        <input
          className="form-input"
          type="password"
          placeholder={placeholder}
          value={val}
          onChange={e => set(e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Gerencie seu perfil e preferências da conta</p>
      </div>

      <div style={{ display: 'grid', gap: 24, maxWidth: 680 }}>

        {/* ── Perfil ── */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <User size={16} style={{ color: 'var(--accent)' }} />
              <span className="card-title">Informações do Perfil</span>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nome completo</label>
                <div className="input-with-icon">
                  <User size={15} className="input-icon" />
                  <input
                    className="form-input"
                    placeholder="Seu nome"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">E-mail</label>
                <div className="input-with-icon">
                  <Mail size={15} className="input-icon" />
                  <input
                    className="form-input"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {profileOk  && <div style={{ color: 'var(--success)', fontSize: 13, background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.25)', borderRadius: 6, padding: '10px 14px' }}>✓ {profileOk}</div>}
              {profileErr && <div style={{ color: 'var(--danger)',  fontSize: 13, background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 6, padding: '10px 14px' }}>✗ {profileErr}</div>}

              <div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Save size={15} />}
                  {saving ? 'Salvando...' : 'Salvar perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Senha ── */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Shield size={16} style={{ color: 'var(--accent2)' }} />
              <span className="card-title">Alterar Senha</span>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {inputPwd('Senha atual', currentPwd, setCurrentPwd, '••••••••')}

              <div className="divider" />

              {inputPwd('Nova senha', newPwd, setNewPwd, 'Mínimo 6 caracteres')}
              {inputPwd('Confirmar nova senha', confirmPwd, setConfirmPwd, 'Repita a nova senha')}

              {pwdOk  && <div style={{ color: 'var(--success)', fontSize: 13, background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.25)', borderRadius: 6, padding: '10px 14px' }}>✓ {pwdOk}</div>}
              {pwdErr && <div style={{ color: 'var(--danger)',  fontSize: 13, background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 6, padding: '10px 14px' }}>✗ {pwdErr}</div>}

              <div>
                <button type="submit" className="btn btn-primary" disabled={savingPwd}>
                  {savingPwd ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Lock size={15} />}
                  {savingPwd ? 'Alterando...' : 'Alterar senha'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Zona de Perigo ── */}
        <div className="card" style={{ border: '1px solid rgba(248,113,113,0.25)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(248,113,113,0.15)' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
              <span className="card-title" style={{ color: 'var(--danger)' }}>Zona de Perigo</span>
            </div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Ao excluir sua conta, todos os seus dados — incluindo leads salvos e histórico de buscas — serão
              <strong style={{ color: 'var(--danger)' }}> removidos permanentemente</strong> e não poderão
              ser recuperados.
            </p>
            <button className="btn btn-danger" onClick={() => setDeleteModal(true)}>
              <Trash2 size={15} /> Excluir minha conta
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal de confirmação ── */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertTriangle size={24} color="var(--danger)" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Confirmar exclusão
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Esta ação é <strong>irreversível</strong>. Digite seu e-mail abaixo para confirmar.
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Digite <strong style={{ color: 'var(--danger)' }}>{email}</strong> para confirmar</label>
              <input
                className="form-input"
                placeholder={email}
                value={confirmDelete}
                onChange={e => setConfirmDelete(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button className="btn btn-secondary w-full" onClick={() => { setDeleteModal(false); setConfirmDelete(''); }}
                style={{ justifyContent: 'center' }}>
                Cancelar
              </button>
              <button
                className="btn btn-danger w-full"
                style={{ justifyContent: 'center' }}
                disabled={confirmDelete !== email || deletingAcc}
                onClick={handleDeleteAccount}
              >
                {deletingAcc ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Trash2 size={15} />}
                {deletingAcc ? 'Excluindo...' : 'Excluir conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
