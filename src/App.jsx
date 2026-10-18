import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import './App.css'

function App() {
  const [tela, setTela] = useState('inicio')
  const [modo, setModo] = useState('login')
  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [vagas, setVagas] = useState([])
  const [inscricoes, setInscricoes] = useState([])
  const [perfis, setPerfis] = useState([])
  const [carregandoVagas, setCarregandoVagas] = useState(false)
  const [enviandoVaga, setEnviandoVaga] = useState(null)
  const [cancelandoInscricaoId, setCancelandoInscricaoId] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [erroVagas, setErroVagas] = useState('')
  const [buscaVaga, setBuscaVaga] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroModalidade, setFiltroModalidade] = useState('')
  const [filtroLocal, setFiltroLocal] = useState('')
  const [vagaSelecionada, setVagaSelecionada] = useState(null)
  const [vagaParaInscricao, setVagaParaInscricao] = useState(null)
  const [abaOrganizacao, setAbaOrganizacao] = useState('resumo')
  const [abaCandidato, setAbaCandidato] = useState('vagas')
  const [abaAdmin, setAbaAdmin] = useState('resumo')
  const [buscaPerfil, setBuscaPerfil] = useState('')
  const [filtroTipoPerfil, setFiltroTipoPerfil] = useState('')
  const [vagaFiltroInscricoes, setVagaFiltroInscricoes] = useState('')

  useEffect(() => {
    let ativo = true

    async function recuperarSessao() {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Erro ao recuperar sessão:', error.message)
        return
      }

      if (ativo && data.session) {
        setUsuario(data.session.user)
        setTela('plataforma')
      }
    }

    recuperarSessao()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      if (ativo) {
        setUsuario(session?.user ?? null)
        if (session) {
          setTela('plataforma')
        } else {
          setPerfil(null)
          setTela('inicio')
        }
      }
    })

    return () => {
      ativo = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!usuario || tela !== 'plataforma') return

    let ativo = true

    async function carregarDados() {
      setCarregandoVagas(true)
      setErroVagas('')
      setMensagem('')

      const resultadoPerfil = await supabase
        .from('perfis')
        .select('id, nome, tipo')
        .eq('id', usuario.id)
        .single()

      if (!ativo) return

      if (resultadoPerfil.error) {
        setErroVagas(`Não foi possível carregar seu perfil: ${resultadoPerfil.error.message}`)
        setCarregandoVagas(false)
        return
      }

      const perfilAtual = resultadoPerfil.data
      setPerfil(perfilAtual)

      if (perfilAtual.tipo === 'candidato') {
        const [resultadoVagas, resultadoInscricoes] = await Promise.all([
          supabase
            .from('vagas')
            .select('*')
            .eq('status', 'aberta')
            .order('criada_em', { ascending: false }),
          supabase
            .from('inscricoes')
            .select('id, vaga_id, status, criada_em')
            .eq('candidato_id', usuario.id)
            .order('criada_em', { ascending: false }),
        ])

        if (!ativo) return

        if (resultadoVagas.error) {
          setErroVagas(resultadoVagas.error.message)
        } else {
          setVagas(resultadoVagas.data ?? [])
        }

        if (resultadoInscricoes.error) {
          setErroVagas((anterior) =>
            anterior
              ? `${anterior} | ${resultadoInscricoes.error.message}`
              : resultadoInscricoes.error.message
          )
        } else {
          setInscricoes(resultadoInscricoes.data ?? [])
        }
      } else if (perfilAtual.tipo === 'organizacao') {
        const [resultadoVagas, resultadoInscricoes] = await Promise.all([
          supabase
            .from('vagas')
            .select('*')
            .eq('criada_por', usuario.id)
            .order('criada_em', { ascending: false }),
          supabase
            .from('inscricoes')
            .select('id, vaga_id, candidato_id, status, criada_em, nome_completo, email_contato, telefone, bairro, escolaridade, experiencia, cursos, apresentacao, mensagem, vagas!inner(titulo)')
            .eq('vagas.criada_por', usuario.id)
            .order('criada_em', { ascending: false }),
        ])

        if (!ativo) return

        if (resultadoVagas.error) {
          setErroVagas(resultadoVagas.error.message)
        } else {
          setVagas(resultadoVagas.data ?? [])
        }

        if (resultadoInscricoes.error) {
          setErroVagas((anterior) =>
            anterior
              ? `${anterior} | ${resultadoInscricoes.error.message}`
              : resultadoInscricoes.error.message
          )
        } else {
          setInscricoes(resultadoInscricoes.data ?? [])
        }
      } else if (perfilAtual.tipo === 'admin') {
        const resultadoPerfis = await supabase
          .from('perfis')
          .select('id, nome, tipo, criado_em')
          .order('criado_em', { ascending: false })

        if (!ativo) return

        if (resultadoPerfis.error) {
          setErroVagas(resultadoPerfis.error.message)
        } else {
          setPerfis(resultadoPerfis.data ?? [])
        }
      }

      setCarregandoVagas(false)
    }

    carregarDados()

    return () => {
      ativo = false
    }
  }, [usuario, tela])

  function abrirAcesso() {
    setModo('login')
    setMensagem('')
    setTela('acesso')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function voltarInicio() {
    setTela('inicio')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function enviarFormulario(event) {
    event.preventDefault()
    setCarregando(true)
    setMensagem('')

    const dados = new FormData(event.currentTarget)
    const email = String(dados.get('email') || '').trim()
    const senha = String(dados.get('senha') || '')

    try {
      if (modo === 'cadastro') {
        const nome = String(dados.get('nome') || '').trim()

        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { data: { nome } },
        })

        if (error) throw error

        if (data.session && data.user) {
          setUsuario(data.user)
          setTela('plataforma')
        } else {
          setMensagem(
            'Cadastro realizado. Se a confirmação por e-mail estiver ativa, confirme seu endereço antes de entrar.'
          )
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        })

        if (error) throw error

        setUsuario(data.user)
        setTela('plataforma')
      }
    } catch (error) {
      setMensagem(`Não foi possível concluir: ${error.message}`)
    } finally {
      setCarregando(false)
    }
  }

  function iniciarInscricao(vaga) {
    if (!usuario) {
      abrirAcesso()
      return
    }

    if (perfil?.tipo !== 'candidato') {
      setMensagem('Somente contas de candidato podem enviar inscrições.')
      return
    }

    const jaInscrito = inscricoes.some((inscricao) => inscricao.vaga_id === vaga.id)
    if (jaInscrito) {
      setMensagem('Você já se inscreveu nesta vaga.')
      setVagaSelecionada(null)
      return
    }

    setVagaSelecionada(null)
    setVagaParaInscricao(vaga)
    setMensagem('')
    setTela('formulario')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function enviarInscricao(event) {
    event.preventDefault()
    if (!usuario || perfil?.tipo !== 'candidato' || !vagaParaInscricao) return

    setCarregando(true)
    setMensagem('')
    const dados = new FormData(event.currentTarget)

    const inscricao = {
      vaga_id: vagaParaInscricao.id,
      candidato_id: usuario.id,
      nome_completo: String(dados.get('nome_completo') || '').trim(),
      email_contato: String(dados.get('email_contato') || '').trim(),
      telefone: String(dados.get('telefone') || '').trim(),
      bairro: String(dados.get('bairro') || '').trim(),
      escolaridade: String(dados.get('escolaridade') || '').trim(),
      experiencia: String(dados.get('experiencia') || '').trim(),
      cursos: String(dados.get('cursos') || '').trim(),
      apresentacao: String(dados.get('apresentacao') || '').trim(),
      consentimento_dados: dados.get('consentimento_dados') === 'on',
      status: 'recebida',
    }

    try {
      if (!inscricao.consentimento_dados) {
        throw new Error('É necessário concordar com o uso dos dados para enviar a inscrição.')
      }

      const { data, error } = await supabase
        .from('inscricoes')
        .insert(inscricao)
        .select('id, vaga_id, status, criada_em')
        .single()

      if (error) {
        if (error.code === '23505') throw new Error('Você já se inscreveu nesta vaga.')
        throw error
      }

      setInscricoes((anteriores) => [data, ...anteriores])
      setVagaParaInscricao(null)
      setMensagem('Inscrição enviada com sucesso. Você poderá acompanhar o status na área do candidato.')
      setTela('plataforma')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setMensagem(`Não foi possível enviar a inscrição: ${error.message}`)
    } finally {
      setCarregando(false)
    }
  }

  async function cancelarInscricao(inscricao) {
    if (!usuario || perfil?.tipo !== 'candidato') return

    if (!['recebida', 'em_analise'].includes(inscricao.status)) {
      setMensagem('Esta inscrição não pode mais ser cancelada pela plataforma.')
      return
    }

    const confirmar = window.confirm(
      'Tem certeza de que deseja cancelar sua inscrição nesta vaga? Essa ação não pode ser desfeita.'
    )
    if (!confirmar) return

    setCancelandoInscricaoId(inscricao.id)
    setMensagem('')

    try {
      const { data, error } = await supabase
        .from('inscricoes')
        .delete()
        .eq('id', inscricao.id)
        .eq('candidato_id', usuario.id)
        .select('id')
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('A permissão de cancelamento ainda não está configurada ou a inscrição não foi encontrada.')

      setInscricoes((anteriores) => anteriores.filter((item) => item.id !== inscricao.id))
      setMensagem('Inscrição cancelada com sucesso.')
    } catch (error) {
      setMensagem(`Não foi possível cancelar a inscrição: ${error.message}`)
    } finally {
      setCancelandoInscricaoId(null)
    }
  }

  async function criarVaga(event) {
    event.preventDefault()
    if (!usuario || perfil?.tipo !== 'organizacao') return

    setCarregando(true)
    setMensagem('')
    const formulario = event.currentTarget
    const dados = new FormData(formulario)

    const novaVaga = {
      titulo: String(dados.get('titulo') || '').trim(),
      descricao: String(dados.get('descricao') || '').trim(),
      requisitos: String(dados.get('requisitos') || '').trim(),
      atividades: String(dados.get('atividades') || '').trim(),
      salario: String(dados.get('salario') || '').trim(),
      beneficios: String(dados.get('beneficios') || '').trim(),
      carga_horaria: String(dados.get('carga_horaria') || '').trim(),
      prazo_inscricao: String(dados.get('prazo_inscricao') || '') || null,
      tipo: String(dados.get('tipo') || 'Emprego'),
      local: String(dados.get('local') || 'Rio de Janeiro - RJ').trim(),
      modalidade: String(dados.get('modalidade') || 'Presencial'),
      organizacao: perfil.nome || 'Organização',
      status: 'aberta',
      criada_por: usuario.id,
    }

    const { data, error } = await supabase
      .from('vagas')
      .insert(novaVaga)
      .select('*')
      .single()

    if (error) {
      setMensagem(`Não foi possível publicar a vaga: ${error.message}`)
    } else {
      setVagas((anteriores) => [data, ...anteriores])
      setMensagem('Vaga publicada com sucesso.')
      setAbaOrganizacao('vagas')
      formulario.reset()
    }

    setCarregando(false)
  }

  async function sair() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      setMensagem(`Não foi possível sair: ${error.message}`)
      return
    }

    setUsuario(null)
    setPerfil(null)
    setVagas([])
    setInscricoes([])
    setPerfis([])
    setBuscaVaga('')
    setFiltroTipo('')
    setFiltroModalidade('')
    setFiltroLocal('')
    setTela('inicio')
  }

  function nomeStatus(status) {
    const nomes = {
      recebida: 'Recebida',
      em_analise: 'Em análise',
      aprovada: 'Aprovada',
      recusada: 'Não selecionada',
    }
    return nomes[status] ?? status
  }

  function formatarData(data) {
    if (!data) return ''
    return new Date(data).toLocaleDateString('pt-BR')
  }

  if (tela === 'formulario') {
    return (
      <div className="access-page">
        <header className="access-header">
          <a className="logo" href="#inicio" onClick={(event) => { event.preventDefault(); setTela('plataforma') }}>
            <img className="logo-image" src="/logo-oportuniza.png" alt="Oportuniza RJ" />
          </a>
          <button className="back-button" type="button" onClick={() => { setVagaParaInscricao(null); setTela('plataforma') }}>
            ← Voltar às vagas
          </button>
        </header>
        <main className={`access-main css-inline-1`} >
          <section className={`access-card css-inline-2`} >
            <p className="eyebrow">FORMULÁRIO DE CANDIDATURA</p>
            <h1>Conte um pouco sobre você.</h1>
            <p className="access-description">Preencha os campos para enviar sua candidatura. As informações serão compartilhadas com a organização responsável pela vaga.</p>
            {vagaParaInscricao && (
              <div className={`css-inline-3`} >
                <strong>{vagaParaInscricao.titulo}</strong>
                <p className={`css-inline-4`} >{vagaParaInscricao.organizacao} · {vagaParaInscricao.local} · {vagaParaInscricao.modalidade}</p>
              </div>
            )}
            {mensagem && <p className={`css-inline-5`} role="status" >{mensagem}</p>}
            <form className="access-form" onSubmit={enviarInscricao}>
              <label>Nome completo<input name="nome_completo" autoComplete="name" defaultValue={perfil?.nome || ''} maxLength={160} required /></label>
              <label>E-mail para contato<input name="email_contato" type="email" autoComplete="email" defaultValue={usuario?.email || ''} maxLength={254} required /></label>
              <label>Telefone<input name="telefone" type="tel" autoComplete="tel" placeholder="(21) 99999-9999" maxLength={30} required /></label>
              <label>Bairro ou região onde mora<input name="bairro" autoComplete="address-level3" placeholder="Ex.: Maré, Campo Grande, Centro" maxLength={120} required /></label>
              <label>Escolaridade<select name="escolaridade" defaultValue="" required><option value="" disabled>Selecione uma opção</option><option>Ensino fundamental incompleto</option><option>Ensino fundamental completo</option><option>Ensino médio incompleto</option><option>Ensino médio completo</option><option>Ensino técnico</option><option>Ensino superior incompleto</option><option>Ensino superior completo</option><option>Outro</option></select></label>
              <label>Experiência profissional<textarea name="experiencia" rows="3" placeholder="Conte brevemente sobre experiências anteriores. Se não tiver, pode informar que está buscando a primeira oportunidade." maxLength={3000} /></label>
              <label>Cursos e habilidades<textarea name="cursos" rows="3" placeholder="Cursos, conhecimentos ou habilidades relevantes (opcional)." maxLength={2000} /></label>
              <label>Por que esta oportunidade interessa a você?<textarea name="apresentacao" rows="4" placeholder="Apresente-se e conte o que gostaria de aprender ou contribuir." maxLength={3000} required /></label>
              <label className={`css-inline-6`} ><input className={`css-inline-7`} name="consentimento_dados" type="checkbox" required  /><span>Concordo que os dados deste formulário sejam usados pela organização responsável para avaliar minha candidatura.</span></label>
              <button className="primary-button full-button" type="submit" disabled={carregando || !vagaParaInscricao}>{carregando ? 'Enviando candidatura...' : 'Enviar inscrição'} <span aria-hidden="true">→</span></button>
            </form>
          </section>
        </main>
        <footer className="footer">
          <a
            className="logo"
            href="#inicio"
            onClick={(event) => {
              event.preventDefault()
              voltarInicio()
            }}
          >
            <img className="logo-image" src="/logo-oportuniza.png" alt="Oportuniza RJ" />
          </a>

          <p>Projeto acadêmico de impacto social · Rio de Janeiro</p>

          <a
            className="footer-top"
            href="#inicio"
            onClick={(event) => {
              event.preventDefault()
              voltarInicio()
            }}
          >
            Voltar ao início ↑
          </a>
        </footer>
      </div>
    )
  }

  if (tela === 'plataforma') {
    const tipoPerfil = perfil?.tipo
    const vagasFiltradas = vagas.filter((vaga) => {
      const termo = buscaVaga.trim().toLocaleLowerCase('pt-BR')
      const correspondeBusca = !termo || [vaga.titulo, vaga.descricao, vaga.organizacao, vaga.local]
        .some((valor) => String(valor || '').toLocaleLowerCase('pt-BR').includes(termo))
      const correspondeTipo = !filtroTipo || vaga.tipo === filtroTipo
      const correspondeModalidade = !filtroModalidade || vaga.modalidade === filtroModalidade
      const correspondeLocal = !filtroLocal || String(vaga.local || '').toLocaleLowerCase('pt-BR').includes(filtroLocal.trim().toLocaleLowerCase('pt-BR'))
      return correspondeBusca && correspondeTipo && correspondeModalidade && correspondeLocal
    })
    const tituloPainel =
      tipoPerfil === 'admin'
        ? 'Painel administrativo'
        : tipoPerfil === 'organizacao'
          ? 'Área da organização'
          : 'Área do candidato'

    return (
      <div className="access-page">
        <header className="access-header">
          <a
            className="logo"
            href="#inicio"
            onClick={(event) => {
              event.preventDefault()
              voltarInicio()
            }}
          >
            <img className="logo-image" src="/logo-oportuniza.png" alt="Oportuniza RJ" />
          </a>
          <button className="back-button" onClick={sair}>
            Sair da conta
          </button>
        </header>

        <main
          className={`access-main css-inline-8`}
          
        >
          <section className={`access-card css-inline-9`} >
            <p className="eyebrow">{tituloPainel.toUpperCase()}</p>
            <h1>
              {tipoPerfil === 'admin'
                ? 'Visão geral da plataforma.'
                : tipoPerfil === 'organizacao'
                  ? 'Gerencie suas oportunidades.'
                  : 'Encontre sua próxima oportunidade.'}
            </h1>
            <p className="access-description">
              {tipoPerfil === 'admin'
                ? 'Consulte os perfis cadastrados na plataforma.'
                : tipoPerfil === 'organizacao'
                  ? 'Publique vagas e acompanhe as inscrições recebidas.'
                  : 'Consulte as vagas disponíveis e acompanhe suas inscrições.'}
            </p>
            <p><strong>E-mail:</strong> {usuario?.email}</p>
            {perfil && <p><strong>Perfil:</strong> {perfil.tipo}</p>}

            {mensagem && <p className={`css-inline-10`} role="status" >{mensagem}</p>}
            {erroVagas && <p className={`css-inline-11`} role="alert" >Erro ao carregar os dados: {erroVagas}</p>}
            {carregandoVagas && <p>Carregando dados...</p>}

            {!perfil && !erroVagas && <p>Carregando seu perfil...</p>}

            {tipoPerfil === 'candidato' && (
              <>
                <div className={`css-inline-12`} >
                  {[
                    { label: 'Oportunidades', value: vagas.length, detail: 'Trabalho e formação' },
                    { label: 'Minhas inscrições', value: inscricoes.length, detail: 'Candidaturas enviadas' },
                    { label: 'Em andamento', value: inscricoes.filter((item) => ['recebida', 'em_analise'].includes(item.status)).length, detail: 'Aguardando retorno' },
                  ].map((item) => (
                    <article className={`css-inline-13`} key={item.label} >
                      <p className={`css-inline-14`} >{item.label}</p>
                      <p className={`css-inline-15`} >{item.value}</p>
                      <p className={`css-inline-16`} >{item.detail}</p>
                    </article>
                  ))}
                </div>

                <div className={`css-inline-17`} role="tablist" aria-label="Seções do candidato" >
                  {[['vagas', 'Explorar vagas'], ['inscricoes', 'Minhas inscrições']].map(([id, label]) => (
                    <button key={id} type="button" role="tab" aria-selected={abaCandidato === id} className={`${abaCandidato === id ? 'primary-button' : 'back-button'} css-inline-18`} onClick={() => { setAbaCandidato(id); setMensagem('') }} >
                      {label}{id === 'inscricoes' ? ` (${inscricoes.length})` : ''}
                    </button>
                  ))}
                </div>

                {abaCandidato === 'vagas' && (
                <div className={`css-inline-19`} >
                  <h2>Oportunidades para crescer</h2>
                  <p>Encontre trabalho, estágio, cursos e atividades de formação perto de você ou online.</p>

                  <div className={`css-inline-20`} >
                    <label>Buscar oportunidade
                      <input
                        type="search"
                        value={buscaVaga}
                        onChange={(event) => setBuscaVaga(event.target.value)}
                        placeholder="Título, descrição ou organização"
                        aria-label="Buscar por título, descrição, organização ou local"
                      />
                    </label>
                    <label>Tipo de oportunidade
                      <select value={filtroTipo} onChange={(event) => setFiltroTipo(event.target.value)}>
                        <option value="">Todos os tipos</option>
                        <option value="Emprego">Emprego</option>
                        <option value="Estágio">Estágio</option>
                        <option value="Primeiro emprego">Primeiro emprego</option>
                        <option value="Voluntariado">Voluntariado</option>
                        <option value="Curso">Cursos</option>
                        <option value="Workshop">Workshops</option>
                        <option value="Formação">Formação profissional</option>
                      </select>
                    </label>
                    <label>Modalidade
                      <select value={filtroModalidade} onChange={(event) => setFiltroModalidade(event.target.value)}>
                        <option value="">Todas as modalidades</option>
                        <option value="Presencial">Presencial</option>
                        <option value="Híbrido">Híbrido</option>
                        <option value="Remoto">Remoto</option>
                      </select>
                    </label>
                    <label>Localização
                      <input
                        type="search"
                        value={filtroLocal}
                        onChange={(event) => setFiltroLocal(event.target.value)}
                        placeholder="Ex.: Rio de Janeiro"
                        aria-label="Filtrar por localização"
                      />
                    </label>
                  </div>

                  {(buscaVaga || filtroTipo || filtroModalidade || filtroLocal) && (
                    <div className={`css-inline-21`} >
                      <p className={`css-inline-22`} >Resultados encontrados: {vagasFiltradas.length}</p>
                      <button
                        type="button"
                        className="back-button"
                        onClick={() => { setBuscaVaga(''); setFiltroTipo(''); setFiltroModalidade(''); setFiltroLocal('') }}
                      >
                        Limpar filtros
                      </button>
                    </div>
                  )}

                  {!carregandoVagas && vagas.length === 0 && !erroVagas && (
                    <p>Nenhuma oportunidade disponível no momento. Volte em breve para conferir novas vagas, cursos e oficinas.</p>
                  )}
                  {vagas.length > 0 && vagasFiltradas.length === 0 && (
                    <p role="status">Nenhuma oportunidade corresponde aos filtros. Experimente outro tipo ou limpe os filtros.</p>
                  )}
                  <div className={`css-inline-23`} >
                    {vagasFiltradas.map((vaga) => {
                      const inscricao = inscricoes.find((item) => item.vaga_id === vaga.id)
                      return (
                        <article className={`css-inline-24`} key={vaga.id} >
                          <p className={`css-inline-25`} >
                            {vaga.tipo} · {vaga.titulo.toLowerCase().includes('(exemplo)') ? 'EXEMPLO DEMONSTRATIVO' : 'OPORTUNIDADE'}
                          </p>
                          <h3>{vaga.titulo}</h3>
                          <p>{vaga.descricao}</p>
                          <p className={`css-inline-26`} >{vaga.organizacao} · {vaga.local} · {vaga.modalidade}</p>
                          <div className={`css-inline-27`} >
                            <button className="back-button" type="button" onClick={() => setVagaSelecionada(vaga)}>Ver detalhes</button>
                            {inscricao ? (
                              <p className={`css-inline-28`} ><strong>Inscrição:</strong> {nomeStatus(inscricao.status)}</p>
                            ) : (
                              <button className="primary-button" type="button" onClick={() => iniciarInscricao(vaga)}>Inscrever-se</button>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
                )}

                {abaCandidato === 'vagas' && vagaSelecionada && (
                  <div className={`css-inline-29`} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setVagaSelecionada(null) }} >
                    <section className={`css-inline-30`} role="dialog" aria-modal="true" aria-labelledby="detalhe-vaga-titulo" >
                      <div className={`css-inline-31`} >
                        <div><p className="eyebrow">{vagaSelecionada.tipo} · {['Curso', 'Workshop', 'Formação'].includes(vagaSelecionada.tipo) ? 'FORMAÇÃO E DESENVOLVIMENTO' : 'OPORTUNIDADE'}</p><h2 className={`css-inline-32`} id="detalhe-vaga-titulo" >{vagaSelecionada.titulo}</h2></div>
                        <button className="back-button" type="button" aria-label="Fechar detalhes" onClick={() => setVagaSelecionada(null)}>Fechar ✕</button>
                      </div>
                      <p className={`css-inline-33`} >{vagaSelecionada.organizacao} · {vagaSelecionada.local} · {vagaSelecionada.modalidade}</p>
                      <div className={`css-inline-34`} >
                        {[['Salário / bolsa', vagaSelecionada.salario], ['Carga horária', vagaSelecionada.carga_horaria], ['Prazo de inscrição', formatarData(vagaSelecionada.prazo_inscricao)], ['Benefícios', vagaSelecionada.beneficios]].filter((item) => item[1]).map(([rotulo, valor]) => <div className={`css-inline-35`} key={rotulo} ><p className={`css-inline-36`} >{rotulo}</p><strong>{valor}</strong></div>)}
                      </div>
                      <h3>Sobre a oportunidade</h3><p className={`css-inline-37`} >{vagaSelecionada.descricao || 'Descrição não informada.'}</p>
                      <h3>Atividades</h3><p className={`css-inline-38`} >{vagaSelecionada.atividades || 'As atividades serão detalhadas pela organização responsável.'}</p>
                      <h3>Requisitos</h3><p className={`css-inline-39`} >{vagaSelecionada.requisitos || 'Consulte a descrição da vaga ou entre em contato com a organização responsável.'}</p>
                      <div className={`css-inline-40`} >
                        <button className="primary-button" type="button" onClick={() => iniciarInscricao(vagaSelecionada)} disabled={inscricoes.some((item) => item.vaga_id === vagaSelecionada.id)}> {inscricoes.some((item) => item.vaga_id === vagaSelecionada.id) ? 'Você já se inscreveu' : 'Inscrever-se'} </button>
                        <button className="back-button" type="button" onClick={() => setVagaSelecionada(null)}>Voltar às vagas</button>
                      </div>
                    </section>
                  </div>
                )}

                {abaCandidato === 'inscricoes' && (
                <div className={`css-inline-41`} >
                  <div className={`css-inline-42`} >
                    <div><h2 className={`css-inline-43`} >Minhas inscrições</h2><p className={`css-inline-44`} >Acompanhe o andamento das suas candidaturas e cancele as que ainda estiverem em processamento.</p></div>
                    <button className="back-button" type="button" onClick={() => setAbaCandidato('vagas')}>Explorar vagas →</button>
                  </div>
                  {inscricoes.length === 0 ? (
                    <p>Você ainda não se inscreveu em nenhuma vaga.</p>
                  ) : (
                    <div className={`css-inline-45`} >
                      {inscricoes.map((inscricao) => {
                        const vaga = vagas.find((item) => item.id === inscricao.vaga_id)
                        return (
                          <article className={`css-inline-46`} key={inscricao.id} >
                            <strong>{vaga?.titulo ?? 'Vaga inscrita anteriormente'}</strong>
                            <p className={`css-inline-47`} >Status: {nomeStatus(inscricao.status)}</p>
                            <p className={`css-inline-48`} >Inscrição em {formatarData(inscricao.criada_em)}</p>
                            {['recebida', 'em_analise'].includes(inscricao.status) && (
                              <button
                                className={`back-button css-inline-49`}
                                type="button"
                                onClick={() => cancelarInscricao(inscricao)}
                                disabled={cancelandoInscricaoId === inscricao.id}
                                
                              >
                                {cancelandoInscricaoId === inscricao.id ? 'Cancelando...' : 'Cancelar inscrição'}
                              </button>
                            )}
                          </article>
                        )
                      })}
                    </div>
                  )}
                </div>
                )}
              </>
            )}

            {tipoPerfil === 'organizacao' && (
              <div className={`css-inline-50`} >
                <div className={`css-inline-51`} >
                  {[
                    { label: 'Vagas cadastradas', value: vagas.length, detail: 'Todas as suas oportunidades' },
                    { label: 'Vagas abertas', value: vagas.filter((vaga) => vaga.status === 'aberta').length, detail: 'Visíveis para candidatos' },
                    { label: 'Candidaturas', value: inscricoes.length, detail: 'Recebidas nas suas vagas' },
                  ].map((item) => (
                    <article className={`css-inline-52`} key={item.label} >
                      <p className={`css-inline-53`} >{item.label}</p>
                      <p className={`css-inline-54`} >{item.value}</p>
                      <p className={`css-inline-55`} >{item.detail}</p>
                    </article>
                  ))}
                </div>

                <div className={`css-inline-56`} role="tablist" aria-label="Seções da organização" >
                  {[
                    ['resumo', 'Visão geral'],
                    ['vagas', 'Minhas vagas'],
                    ['inscricoes', 'Candidaturas'],
                    ['publicar', '+ Publicar oportunidade'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={abaOrganizacao === id}
                      className={`${abaOrganizacao === id ? 'primary-button' : 'back-button'} css-inline-57`}
                      onClick={() => { setAbaOrganizacao(id); setMensagem('') }}
                      
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {abaOrganizacao === 'resumo' && (
                  <section aria-labelledby="org-resumo-titulo">
                    <h2 className={`css-inline-58`} id="org-resumo-titulo" >Visão geral</h2>
                    <p className={`css-inline-59`} >Acompanhe as atividades da sua organização e acesse rapidamente as áreas principais.</p>
                    <div className={`css-inline-60`} >
                      <article className={`css-inline-61`} >
                        <h3 className={`css-inline-62`} >Minhas vagas</h3>
                        <p className={`css-inline-63`} >Consulte as oportunidades publicadas e veja quantas candidaturas cada uma recebeu.</p>
                        <button className="back-button" type="button" onClick={() => setAbaOrganizacao('vagas')}>Gerenciar vagas →</button>
                      </article>
                      <article className={`css-inline-64`} >
                        <h3 className={`css-inline-65`} >Candidaturas recebidas</h3>
                        <p className={`css-inline-66`} >Leia as respostas dos candidatos organizadas por vaga.</p>
                        <button className="back-button" type="button" onClick={() => { setVagaFiltroInscricoes(''); setAbaOrganizacao('inscricoes') }}>Ver candidaturas →</button>
                      </article>
                      <article className={`css-inline-67`} >
                        <h3 className={`css-inline-68`} >Nova oportunidade</h3>
                        <p className={`css-inline-69`} >Cadastre uma vaga com informações claras sobre atividades e requisitos.</p>
                        <button className="primary-button" type="button" onClick={() => setAbaOrganizacao('publicar')}>Publicar oportunidade →</button>
                      </article>
                    </div>
                    <h3 className={`css-inline-70`} >Candidaturas recentes</h3>
                    {inscricoes.length === 0 ? (
                      <p>Ainda não há candidaturas. Quando alguém se inscrever, elas aparecerão aqui.</p>
                    ) : (
                      <div className={`css-inline-71`} >
                        {inscricoes.slice(0, 3).map((inscricao) => (
                          <article className={`css-inline-72`} key={inscricao.id} >
                            <div className={`css-inline-73`} >
                              <div><strong>{inscricao.nome_completo || 'Candidato sem nome informado'}</strong><p className={`css-inline-74`} >{inscricao.vagas?.titulo ?? 'Vaga'} · {formatarData(inscricao.criada_em)}</p></div>
                              <span className={`css-inline-75`} >{nomeStatus(inscricao.status)}</span>
                            </div>
                          </article>
                        ))}
                        {inscricoes.length > 3 && <button className="back-button" type="button" onClick={() => setAbaOrganizacao('inscricoes')}>Ver todas as {inscricoes.length} candidaturas →</button>}
                      </div>
                    )}
                  </section>
                )}

                {abaOrganizacao === 'vagas' && (
                  <section aria-labelledby="org-vagas-titulo">
                    <div className={`css-inline-76`} >
                      <div><h2 className={`css-inline-77`} id="org-vagas-titulo" >Minhas vagas</h2><p className={`css-inline-78`} >Veja as oportunidades cadastradas e acompanhe o volume de inscrições.</p></div>
                      <button className="primary-button" type="button" onClick={() => setAbaOrganizacao('publicar')}>+ Publicar oportunidade</button>
                    </div>
                    {vagas.length === 0 && !carregandoVagas && <p>Você ainda não publicou vagas.</p>}
                    <div className={`css-inline-79`} >
                      {vagas.map((vaga) => (
                        <article className={`css-inline-80`} key={vaga.id} >
                          <div className={`css-inline-81`} >
                            <div className={`css-inline-82`} >
                              <p className={`css-inline-83`} >{vaga.tipo}</p>
                              <h3 className={`css-inline-84`} >{vaga.titulo}</h3>
                            </div>
                            <span className={`css-inline-85 ${vaga.status === 'aberta' ? 'css-inline-85-background-yes' : 'css-inline-85-background-no'} ${vaga.status === 'aberta' ? 'css-inline-85-color-yes' : 'css-inline-85-color-no'}`} >{vaga.status === 'aberta' ? 'Aberta' : 'Encerrada'}</span>
                          </div>
                          <p className={`css-inline-86`} >{vaga.descricao}</p>
                          <p className={`css-inline-87`} >{vaga.local} · {vaga.modalidade}{vaga.carga_horaria ? ` · ${vaga.carga_horaria}` : ''}</p>
                          <div className={`css-inline-88`} >
                            <p className={`css-inline-89`} ><strong>{inscricoes.filter((item) => item.vaga_id === vaga.id).length}</strong> candidatura(s)</p>
                            <button className="back-button" type="button" onClick={() => { setVagaFiltroInscricoes(vaga.id); setAbaOrganizacao('inscricoes') }}>Ver candidaturas →</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {abaOrganizacao === 'inscricoes' && (
                  <section aria-labelledby="org-inscricoes-titulo">
                    <div><h2 className={`css-inline-90`} id="org-inscricoes-titulo" >Candidaturas recebidas</h2><p className={`css-inline-91`} >Consulte as informações enviadas pelos candidatos. Use o filtro para focar em uma vaga específica.</p></div>
                    <label className={`css-inline-92`} >Filtrar por vaga
                      <select value={vagaFiltroInscricoes} onChange={(event) => setVagaFiltroInscricoes(event.target.value)}>
                        <option value="">Todas as vagas</option>
                        {vagas.map((vaga) => <option key={vaga.id} value={vaga.id}>{vaga.titulo}</option>)}
                      </select>
                    </label>
                    {inscricoes.filter((item) => !vagaFiltroInscricoes || item.vaga_id === vagaFiltroInscricoes).length === 0 ? (
                      <p>{inscricoes.length === 0 ? 'Ainda não há candidaturas para suas vagas.' : 'Não há candidaturas para a vaga selecionada.'}</p>
                    ) : (
                      <div className={`css-inline-93`} >
                        {inscricoes.filter((item) => !vagaFiltroInscricoes || item.vaga_id === vagaFiltroInscricoes).map((inscricao) => (
                          <article className={`css-inline-94`} key={inscricao.id} >
                            <div className={`css-inline-95`} >
                              <div><p className={`css-inline-96`} >CANDIDATURA</p><h3 className={`css-inline-97`} >{inscricao.nome_completo || 'Candidato sem nome informado'}</h3><p className={`css-inline-98`} >{inscricao.vagas?.titulo ?? 'Vaga'} · Recebida em {formatarData(inscricao.criada_em)}</p></div>
                              <span className={`css-inline-99`} >{nomeStatus(inscricao.status)}</span>
                            </div>
                            <div className={`css-inline-100`} >
                              <div className={`css-inline-101`} ><p className={`css-inline-102`} >E-mail</p><strong className={`css-inline-103`} >{inscricao.email_contato || 'Não informado'}</strong></div>
                              <div className={`css-inline-104`} ><p className={`css-inline-105`} >Telefone</p><strong>{inscricao.telefone || 'Não informado'}</strong></div>
                              <div className={`css-inline-106`} ><p className={`css-inline-107`} >Bairro / região</p><strong>{inscricao.bairro || 'Não informado'}</strong></div>
                              <div className={`css-inline-108`} ><p className={`css-inline-109`} >Escolaridade</p><strong>{inscricao.escolaridade || 'Não informado'}</strong></div>
                            </div>
                            <details>
                              <summary className={`css-inline-110`} >Ver respostas completas</summary>
                              <div className={`css-inline-111`} >
                                <p><strong>Experiência profissional</strong></p><p className={`css-inline-112`} >{inscricao.experiencia || 'Não informada'}</p>
                                <p><strong>Cursos e habilidades</strong></p><p className={`css-inline-113`} >{inscricao.cursos || 'Não informados'}</p>
                                <p><strong>Apresentação pessoal</strong></p><p className={`css-inline-114`} >{inscricao.apresentacao || inscricao.mensagem || 'Não informada'}</p>
                              </div>
                            </details>
                          </article>
                        ))}
                      </div>
                    )}
                    <p className={`css-inline-115`} >A alteração do status das candidaturas será adicionada depois de configurarmos a permissão segura no banco de dados.</p>
                  </section>
                )}

                {abaOrganizacao === 'publicar' && (
                  <section aria-labelledby="org-publicar-titulo">
                    <h2 className={`css-inline-116`} id="org-publicar-titulo" >Publicar oportunidade</h2>
                    <p className={`css-inline-117`} >Cadastre uma vaga, curso ou atividade formativa. Inclua informações claras sobre público, formato e participação.</p>
                    <form className="access-form" onSubmit={criarVaga}>
                      <label>Título da vaga<input name="titulo" required maxLength={120} placeholder="Ex.: Assistente administrativo ou Oficina de currículo" /></label>
                      <label>Descrição<textarea name="descricao" required rows="4" placeholder="Explique o objetivo, o conteúdo e para quem a oportunidade é indicada." /></label>
                      <label>Atividades<textarea name="atividades" rows="3" placeholder="Conteúdo, atividades ou responsabilidades (opcional)." /></label>
                      <label>Requisitos<textarea name="requisitos" rows="3" placeholder="Pré-requisitos ou materiais necessários (opcional)." /></label>
                      <label>Salário ou bolsa<input name="salario" placeholder="Ex.: A combinar, bolsa de R$ 900" maxLength={120} /></label>
                      <label>Benefícios<input name="beneficios" placeholder="Ex.: vale-transporte, refeição (opcional)" maxLength={240} /></label>
                      <label>Carga horária<input name="carga_horaria" placeholder="Ex.: 30 horas semanais" maxLength={120} /></label>
                      <label>Prazo para inscrição<input name="prazo_inscricao" type="date" /></label>
                      <label>Tipo
                        <select name="tipo" defaultValue="Emprego">
                          <option>Emprego</option><option>Estágio</option><option>Primeiro emprego</option><option>Voluntariado</option><option>Curso</option><option>Workshop</option><option>Formação</option>
                        </select>
                      </label>
                      <label>Local<input name="local" defaultValue="Rio de Janeiro - RJ" required /></label>
                      <label>Modalidade
                        <select name="modalidade" defaultValue="Presencial">
                          <option>Presencial</option><option>Híbrido</option><option>Remoto</option>
                        </select>
                      </label>
                      <div className={`css-inline-118`} >
                        <button className="primary-button" type="submit" disabled={carregando}>
                          {carregando ? 'Publicando...' : 'Publicar oportunidade'}
                        </button>
                        <button className="back-button" type="button" onClick={() => setAbaOrganizacao('resumo')}>Cancelar</button>
                      </div>
                    </form>
                  </section>
                )}
              </div>
            )}

            {tipoPerfil === 'admin' && (
              <div className={`css-inline-119`} >
                <div className={`css-inline-120`} >
                  {[
                    { label: 'Total de usuários', value: perfis.length, detail: 'Perfis cadastrados' },
                    { label: 'Candidatos', value: perfis.filter((item) => item.tipo === 'candidato').length, detail: 'Pessoas em busca de oportunidades' },
                    { label: 'Organizações', value: perfis.filter((item) => item.tipo === 'organizacao').length, detail: 'Contas que publicam vagas' },
                    { label: 'Administradores', value: perfis.filter((item) => item.tipo === 'admin').length, detail: 'Gestão da plataforma' },
                  ].map((item) => (
                    <article className={`css-inline-121`} key={item.label} >
                      <p className={`css-inline-122`} >{item.label}</p>
                      <p className={`css-inline-123`} >{item.value}</p>
                      <p className={`css-inline-124`} >{item.detail}</p>
                    </article>
                  ))}
                </div>

                <div className={`css-inline-125`} role="tablist" aria-label="Seções administrativas" >
                  {[['resumo', 'Visão geral'], ['usuarios', 'Usuários cadastrados']].map(([id, label]) => (
                    <button key={id} type="button" role="tab" aria-selected={abaAdmin === id} className={`${abaAdmin === id ? 'primary-button' : 'back-button'} css-inline-126`} onClick={() => setAbaAdmin(id)} >{label}</button>
                  ))}
                </div>

                {abaAdmin === 'resumo' && (
                  <section aria-labelledby="admin-resumo-titulo">
                    <h2 className={`css-inline-127`} id="admin-resumo-titulo" >Visão geral da plataforma</h2>
                    <p className={`css-inline-128`} >Acompanhe a composição da comunidade e acesse a lista de contas cadastradas.</p>
                    <div className={`css-inline-129`} >
                      <h3 className={`css-inline-130`} >Cadastros recentes</h3>
                      {perfis.length === 0 && !carregandoVagas ? <p>Nenhum perfil encontrado ou a consulta foi bloqueada pelas políticas de segurança.</p> : (
                        <div className={`css-inline-131`} >
                          {perfis.slice(0, 5).map((item) => (
                            <article className={`css-inline-132`} key={item.id} >
                              <div><strong>{item.nome || 'Nome não informado'}</strong><p className={`css-inline-133`} >Cadastro: {formatarData(item.criado_em)}</p></div>
                              <span className={`css-inline-134`} >{item.tipo}</span>
                            </article>
                          ))}
                          {perfis.length > 5 && <button className="back-button" type="button" onClick={() => setAbaAdmin('usuarios')}>Ver todos os usuários →</button>}
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {abaAdmin === 'usuarios' && (
                  <section aria-labelledby="admin-usuarios-titulo">
                    <h2 className={`css-inline-135`} id="admin-usuarios-titulo" >Usuários cadastrados</h2>
                    <p className={`css-inline-136`} >Pesquise pelo nome ou filtre por tipo de conta para localizar os perfis.</p>
                    <div className={`css-inline-137`} >
                      <label>Buscar usuário
                        <input type="search" value={buscaPerfil} onChange={(event) => setBuscaPerfil(event.target.value)} placeholder="Nome do usuário" />
                      </label>
                      <label>Tipo de perfil
                        <select value={filtroTipoPerfil} onChange={(event) => setFiltroTipoPerfil(event.target.value)}>
                          <option value="">Todos os perfis</option><option value="candidato">Candidato</option><option value="organizacao">Organização</option><option value="admin">Administrador</option>
                        </select>
                      </label>
                    </div>
                    <p className={`css-inline-138`} >Exibindo {perfis.filter((item) => (!buscaPerfil || String(item.nome || '').toLocaleLowerCase('pt-BR').includes(buscaPerfil.trim().toLocaleLowerCase('pt-BR'))) && (!filtroTipoPerfil || item.tipo === filtroTipoPerfil)).length} de {perfis.length} perfis.</p>
                    {perfis.length === 0 && !carregandoVagas && <p>Nenhum perfil encontrado ou a consulta foi bloqueada pelas políticas de segurança.</p>}
                    <div className={`css-inline-139`} >
                      {perfis.filter((item) => (!buscaPerfil || String(item.nome || '').toLocaleLowerCase('pt-BR').includes(buscaPerfil.trim().toLocaleLowerCase('pt-BR'))) && (!filtroTipoPerfil || item.tipo === filtroTipoPerfil)).map((item) => (
                        <article className={`css-inline-140`} key={item.id} >
                          <div><strong>{item.nome || 'Nome não informado'}</strong><p className={`css-inline-141`} >Cadastro: {formatarData(item.criado_em)}</p></div>
                          <span className={`css-inline-142 ${item.tipo === 'admin' ? 'css-inline-142-background-admin' : item.tipo === 'organizacao' ? 'css-inline-142-background-org' : 'css-inline-142-background-candidate'}`} >{item.tipo}</span>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </section>
        </main>

        <footer className="footer">
          <a
            className="logo"
            href="#inicio"
            onClick={(event) => {
              event.preventDefault()
              voltarInicio()
            }}
          >
            <img className="logo-image" src="/logo-oportuniza.png" alt="Oportuniza RJ" />
          </a>

          <p>Projeto acadêmico de impacto social · Rio de Janeiro</p>

          <a
            className="footer-top"
            href="#inicio"
            onClick={(event) => {
              event.preventDefault()
              voltarInicio()
            }}
          >
            Voltar ao início ↑
          </a>
        </footer>
      </div>
    )
  }

  if (tela === 'acesso') {
    return (
      <div className="access-page">
        <header className="access-header">
          <a
            className="logo"
            href="#inicio"
            onClick={(event) => {
              event.preventDefault()
              voltarInicio()
            }}
          >
            <img className="logo-image" src="/logo-oportuniza.png" alt="Oportuniza RJ" />
          </a>

          <button className="back-button" onClick={voltarInicio}>
            <span aria-hidden="true">←</span> Voltar ao início
          </button>
        </header>

        <main className="access-main">
          <section className="access-card">
            <div className="access-brand-icon" aria-hidden="true">
              <span>o.</span>
            </div>

            <p className="eyebrow">OPORTUNIZA RJ</p>

            <h1>
              {modo === 'login'
                ? 'Que bom ter você aqui.'
                : 'Vamos começar?'}
            </h1>

            <p className="access-description">
              {modo === 'login'
                ? 'Entre na sua conta para acessar a plataforma e acompanhar suas oportunidades.'
                : 'Crie sua conta para acessar as oportunidades e os recursos da plataforma.'}
            </p>

            <div className="access-tabs" role="tablist" aria-label="Acesso">
              <button
                type="button"
                role="tab"
                aria-selected={modo === 'login'}
                className={modo === 'login' ? 'tab active' : 'tab'}
                onClick={() => {
                  setModo('login')
                  setMensagem('')
                }}
              >
                Entrar
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={modo === 'cadastro'}
                className={modo === 'cadastro' ? 'tab active' : 'tab'}
                onClick={() => {
                  setModo('cadastro')
                  setMensagem('')
                }}
              >
                Criar conta
              </button>
            </div>

            <form className="access-form" onSubmit={enviarFormulario}>
              {modo === 'cadastro' && (
                <label>
                  Nome completo
                  <input
                    type="text"
                    name="nome"
                    placeholder="Digite seu nome"
                    autoComplete="name"
                    required
                  />
                </label>
              )}

              <label>
                E-mail
                <input
                  type="email"
                  name="email"
                  placeholder="voce@email.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                Senha
                <input
                  type="password"
                  name="senha"
                  placeholder="Digite sua senha"
                  autoComplete={
                    modo === 'login' ? 'current-password' : 'new-password'
                  }
                  minLength={6}
                  required
                />
              </label>

              <button
                className="primary-button full-button"
                type="submit"
                disabled={carregando}
              >
                {carregando
                  ? 'Aguarde...'
                  : modo === 'login'
                    ? 'Entrar na plataforma'
                    : 'Criar minha conta'}
                <span aria-hidden="true">→</span>
              </button>
            </form>

            {mensagem && (
              <p className={`css-inline-143`} role="status" >
                {mensagem}
              </p>
            )}

            <p className="form-note">
              Área de acesso do Oportuniza RJ.
            </p>
          </section>
        </main>

        <footer className="footer">
          <a
            className="logo"
            href="#inicio"
            onClick={(event) => {
              event.preventDefault()
              voltarInicio()
            }}
          >
            <img className="logo-image" src="/logo-oportuniza.png" alt="Oportuniza RJ" />
          </a>

          <p>Projeto acadêmico de impacto social · Rio de Janeiro</p>

          <a
            className="footer-top"
            href="#inicio"
            onClick={(event) => {
              event.preventDefault()
              voltarInicio()
            }}
          >
            Voltar ao início ↑
          </a>
        </footer>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="logo" href="#inicio" aria-label="Oportuniza RJ - início">
          <img className="logo-image" src="/logo-oportuniza.png" alt="Oportuniza RJ" />
        </a>

        <nav className="main-nav" aria-label="Navegação principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#sobre">Sobre o projeto</a>
        </nav>

        <button className="login-button" onClick={abrirAcesso}>
          Entrar na plataforma
          <span aria-hidden="true">→</span>
        </button>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-content">
            <span className="hero-label">
              <span className="label-dot" />
              OPORTUNIDADES PARA QUEM FAZ O RJ ACONTECER
            </span>

            <h1>
              Da comunidade para o futuro.
              <span> Seu talento merece espaço.</span>
            </h1>

            <p className="hero-description">
              O Oportuniza RJ conecta moradores de comunidades e periferias do Rio de Janeiro a oportunidades de emprego, estágio e primeiro emprego — reunindo vagas, inscrições e acompanhamento em um só lugar.
            </p>

            <div className="hero-actions">
              <button className="primary-button" onClick={abrirAcesso}>
                Acessar plataforma
                <span aria-hidden="true">→</span>
              </button>

              <a className="secondary-link" href="#como-funciona">
                Conheça o projeto
              </a>
            </div>

            <div className="hero-caption">
              <span className="caption-line" />
              Mais acesso a oportunidades. Mais caminhos para escolher.
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="visual-circle circle-one" />
            <div className="visual-circle circle-two" />

            <div className="visual-panel">
              <div className="panel-top">
                <span className="panel-dot" />
                <span>OPORTUNIZA RJ</span>
              </div>

              <div className="panel-icon">
                <svg
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 34L34 10M16 10H34V28"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h2>O CEP não define o seu potencial.</h2>
              <p>
                Uma ponte entre talentos dos territórios e oportunidades profissionais.
              </p>

              <div className="panel-bottom">
                <span className="panel-line" />
                <span>Talento, acesso e novas possibilidades.</span>
              </div>
            </div>

            <div className="floating-note">
              <span className="note-check" aria-hidden="true">
                ✓
              </span>
              <span>
                <strong>Novos caminhos</strong>
                <small>Começam com uma oportunidade</small>
              </span>
            </div>
          </div>
        </section>

        <section className="how-section" id="como-funciona">
          <div className="section-heading">
            <p className="eyebrow">COMO FUNCIONA</p>
            <h2>A oportunidade precisa chegar mais perto.</h2>
            <p>
              Sabemos que encontrar uma oportunidade pode ser mais difícil quando informação, acesso e contatos não chegam a todos os territórios. A plataforma organiza esse caminho em etapas simples.
            </p>
          </div>

          <div className="steps">
            <article className="step">
              <span className="step-number">01</span>
              <div className="step-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="10.8" cy="10.8" r="6.3" />
                  <path d="m15.5 15.5 4 4" />
                </svg>
              </div>
              <h3>Encontre oportunidades</h3>
              <p>Explore oportunidades de trabalho, estágio e primeiro emprego no RJ.</p>
            </article>

            <article className="step">
              <span className="step-number">02</span>
              <div className="step-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M7 12.5 10.2 16 17.5 8" />
                  <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
                </svg>
              </div>
              <h3>Envie sua inscrição</h3>
              <p>Envie seus dados uma vez por oportunidade, com mais organização.</p>
            </article>

            <article className="step">
              <span className="step-number">03</span>
              <div className="step-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 18.5V12m8 6.5V5.5m8 13V9" />
                </svg>
              </div>
              <h3>Acompanhe o andamento</h3>
              <p>Acompanhe suas candidaturas sem perder de vista os próximos passos.</p>
            </article>
          </div>
        </section>

        <section className="about-section" id="sobre">
          <div className="about-heading">
            <p className="eyebrow">SOBRE O PROJETO</p>
            <h2>Talento existe em todo território. A oportunidade também precisa existir.</h2>
          </div>

          <div className="about-content">
            <p>
              O Oportuniza RJ é um projeto acadêmico de impacto social voltado a ampliar o acesso de moradores de comunidades e periferias do Rio de Janeiro a oportunidades profissionais. A proposta parte de um desafio concreto: oportunidades e informações nem sempre chegam de forma acessível a todos os territórios.
            </p>
            <p>
              Por meio de uma plataforma simples, pessoas podem consultar vagas, realizar inscrições e acompanhar o andamento. Organizações podem divulgar oportunidades e organizar candidaturas. O objetivo é reduzir barreiras de acesso e fortalecer conexões com iniciativas de inclusão profissional.
            </p>
            <button className="about-link" onClick={abrirAcesso}>
              Conheça a plataforma <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="logo" href="#inicio">
          <img className="logo-image" src="/logo-oportuniza.png" alt="Oportuniza RJ" />
        </a>

        <p>Projeto acadêmico de impacto social · Rio de Janeiro</p>

        <a className="footer-top" href="#inicio">
          Voltar ao topo ↑
        </a>
      </footer>
    </div>
  )
}

export default App
