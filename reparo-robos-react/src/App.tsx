import { useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, Check, CheckCircle2,
  ChevronRight, Clock3, Cpu, Gauge, History, Play, Plus, RotateCcw, ShieldCheck,
  Sparkles, Trophy, Wrench, X, Zap,
} from 'lucide-react'
import { createRobot } from './game'
import type { CompletedRobot, GameRecord, Robot } from './types'

const MAX_ROBOTS = 5
const STARTING_ROBOTS = 3
const STORE_KEY = 'robofix-records-v1'

function readRecords(): GameRecord[] {
  try {
    const value = localStorage.getItem(STORE_KEY)
    return value ? JSON.parse(value) as GameRecord[] : []
  } catch {
    return []
  }
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function App() {
  const [robots, setRobots] = useState<Robot[]>(() => Array.from({ length: STARTING_ROBOTS }, createRobot))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [started, setStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [repairedRobots, setRepairedRobots] = useState(0)
  const [repairedParts, setRepairedParts] = useState(0)
  const [completed, setCompleted] = useState<CompletedRobot[]>([])
  const [records, setRecords] = useState<GameRecord[]>(readRecords)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const selectedRobot = robots.find((robot) => robot.id === selectedId) ?? robots[0] ?? null
  const totalParts = robots.reduce((sum, robot) => sum + robot.parts.length, 0)
  useEffect(() => {
    if (!started || gameOver) return
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [started, gameOver])

  useEffect(() => {
    if (!started || gameOver) return
    const arrivals = window.setInterval(() => {
      setRobots((current) => {
        if (current.length >= MAX_ROBOTS) {
          setGameOver(true)
          setNotice({ type: 'error', text: 'Oficina lotada! Você não conseguiu atender a todos os robôs.' })
          return current
        }
        const newRobot = createRobot()
        setNotice({ type: 'error', text: `Novo robô chegou: ${newRobot.model}.` })
        return [...current, newRobot]
      })
    }, 18000)
    return () => window.clearInterval(arrivals)
  }, [started, gameOver])

  useEffect(() => {
    if (selectedRobot && selectedRobot.id !== selectedId) setSelectedId(selectedRobot.id)
  }, [selectedRobot, selectedId])

  const sortedRobots = useMemo(() => [...robots].sort((a, b) => {
    const priorityOrder = { Emergência: 0, Padrão: 1, 'Baixo risco': 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority] || a.createdAt - b.createdAt
  }), [robots])

  function startGame() {
    if (!playerName.trim()) {
      setNotice({ type: 'error', text: 'Digite seu nome antes de iniciar a oficina.' })
      return
    }
    if (gameOver) resetGame()
    setStarted(true)
    setGameOver(false)
    setNotice({ type: 'success', text: 'Turno iniciado! Confira os códigos dos componentes.' })
  }

  function saveRecord(finalRobots: number, finalParts: number, finalSeconds: number) {
    const next = [...records, {
      name: playerName.trim() || 'Técnico',
      robots: finalRobots,
      parts: finalParts,
      seconds: finalSeconds,
      date: Date.now(),
    }].sort((a, b) => b.robots - a.robots || a.seconds - b.seconds).slice(0, 10)
    setRecords(next)
    localStorage.setItem(STORE_KEY, JSON.stringify(next))
  }

  function finishRobot(robot: Robot) {
    const done: CompletedRobot = {
      id: robot.id,
      model: robot.model,
      priority: robot.priority,
      partsRepaired: robot.totalParts,
      seconds: Math.max(1, Math.round((Date.now() - robot.createdAt) / 1000)),
      completedAt: Date.now(),
    }
    setCompleted((current) => [done, ...current])
    setRepairedRobots((value) => value + 1)
    setRepairedParts((value) => value + robot.parts.length)
    const remaining = robots.filter((item) => item.id !== robot.id)
    setRobots(remaining)
    setSelectedId(remaining[0]?.id ?? null)
    setCodeInput('')
    setNotice({ type: 'success', text: `${robot.model} consertado e liberado!` })
  }

  function repairPart() {
    if (!started) {
      setNotice({ type: 'error', text: 'Inicie o turno para começar os reparos.' })
      return
    }
    if (!selectedRobot || !selectedRobot.parts[0]) return
    const part = selectedRobot.parts[0]
    if (codeInput.trim().toUpperCase() !== part.code) {
      setNotice({ type: 'error', text: 'Código incorreto. Confira o componente e tente novamente.' })
      return
    }
    const updatedParts = selectedRobot.parts.slice(1)
    setCodeInput('')
    setNotice({ type: 'success', text: `${part.name} substituído com sucesso!` })
    if (updatedParts.length === 0) {
      finishRobot({ ...selectedRobot, parts: [part] })
      // Correct the per-robot statistics: the last part is included in finishRobot.
    } else {
      setRobots((current) => current.map((robot) => robot.id === selectedRobot.id ? { ...robot, parts: updatedParts } : robot))
    }
  }

  function manualArrival() {
    if (!started || gameOver) {
      setNotice({ type: 'error', text: 'Inicie o turno antes de receber novos robôs.' })
      return
    }
    if (robots.length >= MAX_ROBOTS) {
      setGameOver(true)
      setNotice({ type: 'error', text: 'Oficina lotada! Fim de jogo.' })
      saveRecord(repairedRobots, repairedParts, seconds)
      return
    }
    const robot = createRobot()
    setRobots((current) => [...current, robot])
    setSelectedId(robot.id)
    setNotice({ type: 'success', text: `Robô ${robot.model} entrou na oficina.` })
  }

  function endGame() {
    if (!started || gameOver) return
    setGameOver(true)
    setStarted(false)
    saveRecord(repairedRobots, repairedParts, seconds)
    setNotice({ type: 'error', text: 'Turno encerrado. Seu resultado foi salvo no ranking.' })
  }

  function resetGame() {
    const freshRobots = Array.from({ length: STARTING_ROBOTS }, createRobot)
    setRobots(freshRobots)
    setSelectedId(freshRobots[0]?.id ?? null)
    setCodeInput('')
    setStarted(false)
    setGameOver(false)
    setSeconds(0)
    setRepairedRobots(0)
    setRepairedParts(0)
    setCompleted([])
    setNotice({ type: 'success', text: 'Nova oficina preparada. Digite seu nome e inicie o turno.' })
  }

  const priorityClass = (priority: Robot['priority']) => priority === 'Emergência' ? 'urgent' : priority === 'Padrão' ? 'normal' : 'low'

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Wrench size={23} /></div>
          <div><strong>ROBO<span>FIX</span></strong><small>FUTURE REPAIR LAB</small></div>
        </div>
        <div className="side-label">OFICINA</div>
        <div className="nav-item active"><Activity size={18} /> Painel de reparos</div>
        <div className="nav-item"><History size={18} /> Histórico do turno</div>
        <div className="nav-item"><Trophy size={18} /> Ranking</div>
        <div className="sidebar-bottom">
          <div className="status-orb"><span /></div>
          <div><strong>Sistema operacional</strong><small>Todos os módulos ativos</small></div>
          <span className="online-dot" />
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div className="breadcrumb">CENTRO DE MANUTENÇÃO <ChevronRight size={14} /> <span>PAINEL PRINCIPAL</span></div>
          <div className="topbar-right"><span className="live"><span /> SISTEMA AO VIVO</span><div className="avatar">TX</div></div>
        </header>

        <div className="page-heading">
          <div><div className="eyebrow"><Sparkles size={14} /> SIMULADOR DE MANUTENÇÃO 2.0</div><h1>Oficina <span>Futurista</span></h1><p>Repare os robôs, gerencie prioridades e mantenha a oficina funcionando.</p></div>
          <div className="shift-card"><div className="shift-icon"><Clock3 size={18} /></div><div><small>TEMPO DE TURNO</small><strong>{formatTime(seconds)}</strong></div><span className={started ? 'shift-status on' : 'shift-status'}>{started ? 'EM ANDAMENTO' : 'AGUARDANDO'}</span></div>
        </div>

        {notice && <div className={`notice ${notice.type}`}><span>{notice.type === 'success' ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}{notice.text}</span><button aria-label="Fechar aviso" onClick={() => setNotice(null)}><X size={16} /></button></div>}

        <div className="stats-grid">
          <div className="stat-card"><div className="stat-top"><span>ROBÔS NA OFICINA</span><div className="stat-icon blue"><Cpu size={18} /></div></div><div className="stat-value">{robots.length}<small> / {MAX_ROBOTS}</small></div><div className="stat-foot"><span className="mini-track"><i style={{ width: `${robots.length / MAX_ROBOTS * 100}%` }} /></span><span>{MAX_ROBOTS - robots.length} vagas livres</span></div></div>
          <div className="stat-card"><div className="stat-top"><span>ROBÔS CONSERTADOS</span><div className="stat-icon green"><CheckCircle2 size={18} /></div></div><div className="stat-value">{repairedRobots.toString().padStart(2, '0')}</div><div className="stat-foot"><span className="positive"><ArrowRight size={13} /> Neste turno</span><span>total finalizado</span></div></div>
          <div className="stat-card"><div className="stat-top"><span>PEÇAS PENDENTES</span><div className="stat-icon orange"><Wrench size={18} /></div></div><div className="stat-value">{totalParts.toString().padStart(2, '0')}</div><div className="stat-foot"><span>Em {robots.length} robôs</span><span className="orange-text">Aguardando reparo</span></div></div>
          <div className="stat-card"><div className="stat-top"><span>PEÇAS SUBSTITUÍDAS</span><div className="stat-icon purple"><Zap size={18} /></div></div><div className="stat-value">{repairedParts.toString().padStart(2, '0')}</div><div className="stat-foot"><span className="positive"><Check size={13} /> Confirmadas</span><span>neste turno</span></div></div>
        </div>

        <div className="workspace-grid">
          <section className="panel repair-panel">
            <div className="panel-heading"><div><div className="section-kicker">ÁREA DE TRABALHO</div><h2><Wrench size={20} /> Estação de reparo</h2></div><span className="panel-chip"><span /> {started && !gameOver ? 'ATIVA' : 'PAUSADA'}</span></div>
            {!started && !gameOver && <div className="start-banner"><div className="start-symbol"><Play size={21} fill="currentColor" /></div><div className="start-copy"><strong>Pronto para iniciar o turno?</strong><span>Insira seu nome e comece a reparar os robôs.</span></div><div className="start-form"><input value={playerName} onChange={(e) => setPlayerName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && startGame()} placeholder="Nome do técnico" aria-label="Nome do técnico" /><button className="primary-button" onClick={startGame}><Play size={15} fill="currentColor" /> Iniciar</button></div></div>}
            {gameOver && <div className="game-over"><div className="game-over-icon"><AlertTriangle size={26} /></div><h3>Turno finalizado</h3><p>Você consertou {repairedRobots} robô(s) e substituiu {repairedParts} componente(s) em {formatTime(seconds)}.</p><button className="primary-button" onClick={resetGame}><RotateCcw size={15} /> Nova partida</button></div>}
            <div className="robot-display">
              <div className="robot-stage-grid" />
              {selectedRobot ? <div className="robot-illustration" aria-label={`Ilustração do robô ${selectedRobot.model}`}>
                <div className="robot-shadow" /><div className="robot-antenna" /><div className="robot-head"><div className="robot-ear left" /><div className="robot-ear right" /><div className="robot-eye" /><div className="robot-eye" /><div className="robot-mouth" /></div><div className="robot-neck" /><div className="robot-body"><div className="robot-core"><Zap size={24} /></div><div className="robot-bolt left" /><div className="robot-bolt right" /><div className="robot-panel-line" /></div><div className="robot-arm left"><i /></div><div className="robot-arm right"><i /></div><div className="robot-leg left" /><div className="robot-leg right" /><div className="robot-foot left" /><div className="robot-foot right" />
              </div> : <div className="empty-robot"><Cpu size={38} /><span>Nenhum robô selecionado</span></div>}
              <div className="stage-label"><span className="stage-dot" /> {selectedRobot ? `UNIDADE ${selectedRobot.id.slice(0, 5).toUpperCase()}` : 'SISTEMA EM ESPERA'}</div>
              <div className="stage-corner top-left" /><div className="stage-corner top-right" /><div className="stage-corner bottom-left" /><div className="stage-corner bottom-right" />
            </div>
            {selectedRobot && !gameOver && <div className="repair-details">
              <div className="robot-info"><div><small>MODELO DO ROBÔ</small><h3>{selectedRobot.model}</h3></div><span className={`priority ${priorityClass(selectedRobot.priority)}`}>{selectedRobot.priority === 'Emergência' && <AlertTriangle size={12} />}{selectedRobot.priority}</span></div>
              <div className="part-progress"><div><span>COMPONENTES DEFEITUOSOS</span><strong>{selectedRobot.parts.length} restante(s)</strong></div><div className="progress-track"><i style={{ width: `${Math.max(8, (1 - selectedRobot.parts.length / 4) * 100)}%` }} /></div></div>
              <div className="component-card"><div className="component-art"><Cpu size={25} /><span>!</span></div><div className="component-data"><small>PRÓXIMO COMPONENTE</small><strong>{selectedRobot.parts[0]?.name}</strong><span><Clock3 size={13} /> Tempo estimado: {selectedRobot.parts[0]?.seconds}s</span></div><div className="component-index">01<span> / {selectedRobot.parts.length.toString().padStart(2, '0')}</span></div></div>
              <div className="code-entry"><label htmlFor="repair-code">CÓDIGO DE SUBSTITUIÇÃO</label><div className="code-input-row"><div className="code-input-wrap"><Cpu size={16} /><input id="repair-code" value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && repairPart()} placeholder="Digite o código do componente" maxLength={4} disabled={!started} autoComplete="off" /><span>4 CARACTERES</span></div><button className="repair-button" onClick={repairPart} disabled={!started || !selectedRobot.parts.length}><Wrench size={16} /> Substituir</button></div><p><ShieldCheck size={13} /> O código correto é exibido na etiqueta da peça no modo de treinamento.</p></div>
            </div>}
            {selectedRobot && <div className="training-code"><span><Sparkles size={14} /> MODO DE TREINAMENTO</span><span>Código da peça: <strong>{selectedRobot.parts[0]?.code ?? '—'}</strong></span></div>}
          </section>

          <div className="right-column">
            <section className="panel queue-panel">
              <div className="panel-heading"><div><div className="section-kicker">GERENCIAMENTO</div><h2><Activity size={19} /> Fila de atendimento</h2></div><span className="count-pill">{robots.length} unidades</span></div>
              <div className="queue-summary"><span><span className="queue-dot urgent-dot" /> Emergência</span><strong>{robots.filter((r) => r.priority === 'Emergência').length}</strong><span><span className="queue-dot standard-dot" /> Padrão</span><strong>{robots.filter((r) => r.priority === 'Padrão').length}</strong><span><span className="queue-dot low-dot" /> Baixo risco</span><strong>{robots.filter((r) => r.priority === 'Baixo risco').length}</strong></div>
              <div className="robot-queue">
                {sortedRobots.map((robot, index) => <button key={robot.id} className={`queue-item ${selectedRobot?.id === robot.id ? 'selected' : ''}`} onClick={() => { setSelectedId(robot.id); setCodeInput('') }}>
                  <div className={`queue-robot-icon ${priorityClass(robot.priority)}`}><Cpu size={19} /></div><div className="queue-robot-info"><strong>{robot.model}</strong><span>{robot.parts.length} componente(s) pendente(s)</span><div className={`priority-dot-label ${priorityClass(robot.priority)}`}><i />{robot.priority}</div></div><div className="queue-position">#{String(index + 1).padStart(2, '0')}<ChevronRight size={15} /></div>
                </button>)}
                {robots.length === 0 && <div className="queue-empty"><CheckCircle2 size={24} /><strong>Fila vazia!</strong><span>Todos os robôs foram atendidos.</span></div>}
              </div>
              <button className="arrival-button" onClick={manualArrival} disabled={!started || gameOver}><Plus size={16} /> Registrar chegada de robô <span>+</span></button>
              <div className="queue-note"><AlertTriangle size={15} /><span>Limite de segurança: <strong>{MAX_ROBOTS} robôs</strong>. A oficina lotada encerra a partida.</span></div>
            </section>

            <section className="panel activity-panel">
              <div className="panel-heading"><div><div className="section-kicker">REGISTRO EM TEMPO REAL</div><h2><History size={19} /> Últimos reparos</h2></div><span className="count-pill">{completed.length} feitos</span></div>
              <div className="activity-list">
                {completed.slice(0, 4).map((item) => <div className="activity-item" key={item.id}><div className="activity-check"><Check size={15} /></div><div><strong>{item.model}</strong><span>{item.partsRepaired} componente(s) substituído(s)</span></div><small>{new Date(item.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small></div>)}
                {completed.length === 0 && <div className="activity-empty"><div className="activity-empty-icon"><Gauge size={20} /></div><div><strong>Nenhum reparo registrado</strong><span>Os reparos concluídos aparecerão aqui.</span></div></div>}
              </div>
            </section>
          </div>
        </div>

        <section className="ranking-panel panel">
          <div className="panel-heading"><div><div className="section-kicker">HALL DA FAMA</div><h2><Trophy size={19} /> Ranking de técnicos</h2></div><span className="count-pill">TOP 10</span></div>
          {records.length ? <div className="ranking-table"><div className="ranking-row ranking-header"><span>POSIÇÃO</span><span>TÉCNICO</span><span>ROBÔS CONSERTADOS</span><span>PEÇAS SUBSTITUÍDAS</span><span>TEMPO TOTAL</span></div>{records.map((record, index) => <div className="ranking-row" key={`${record.name}-${record.date}`}><span className="rank-number">{String(index + 1).padStart(2, '0')}</span><span className="rank-name"><span className="rank-avatar">{record.name.slice(0, 1).toUpperCase()}</span>{record.name}</span><strong>{record.robots}</strong><span>{record.parts}</span><span className="rank-time">{formatTime(record.seconds)}</span></div>)}</div> : <div className="ranking-empty"><Trophy size={22} /><span>O ranking será preenchido ao finalizar uma partida.</span></div>}
        </section>
        <footer><span>ROBOFIX <b>•</b> SIMULADOR DE MANUTENÇÃO</span><span><span className="online-dot" /> DADOS SALVOS NESTE DISPOSITIVO</span></footer>
      </section>
    </main>
  )
}

export default App
