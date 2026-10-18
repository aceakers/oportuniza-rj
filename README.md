<div align="center">
  <img src="./public/logo-oportuniza.png" alt="Logo Oportuniza RJ" width="280">
  <h1>Oportuniza RJ</h1>
  <p><strong>Mais oportunidades para quem faz o Rio de Janeiro acontecer.</strong></p>
  <p>Desafio 03 · Tecnologia para o Impacto Social · KodieAcademy · 2026</p>
</div>

---

## Neste README

- [Sobre o projeto](#sobre-o-projeto)
- [O que você pode fazer](#o-que-você-pode-fazer)
- [Tecnologias](#tecnologias)
- [Como funciona](#como-funciona)
- [Banco de dados e segurança](#banco-de-dados-e-segurança)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como executar localmente](#como-executar-localmente)
- [Publicação](#publicação)
- [Decisões de desenvolvimento](#decisões-de-desenvolvimento)
- [Uso de inteligência artificial](#uso-de-inteligência-artificial)
- [Entrega do desafio](#entrega-do-desafio)

## Sobre o projeto

O Oportuniza RJ é uma plataforma web que busca aproximar pessoas de oportunidades de emprego, estágio, primeiro emprego, cursos e capacitação profissional no Rio de Janeiro.

A proposta parte de um desafio social: facilitar o acesso à informação sobre oportunidades e tornar o processo de candidatura mais organizado e acessível, especialmente para pessoas que enfrentam barreiras para ingressar ou retornar ao mercado de trabalho.

O projeto foi desenvolvido para o Desafio 03 da KodieAcademy — Tecnologia para o Impacto Social, com foco na construção de uma solução digital funcional, com cadastro de informações, persistência em banco de dados e acompanhamento de solicitações.

## O que você pode fazer

- Explorar oportunidades de trabalho, estágio e formação profissional;
- Consultar informações sobre as vagas, como descrição, requisitos e modalidade, conforme os dados cadastrados;
- Cadastrar-se e entrar na plataforma para acessar as funcionalidades disponíveis de acordo com o perfil;
- Enviar candidaturas preenchendo um formulário com informações de contato e apresentação;
- Acompanhar candidaturas e consultar o status das solicitações enviadas;
- Gerenciar oportunidades e candidaturas por meio da área destinada às organizações.

O fluxo de candidatura permite registrar uma solicitação e acompanhar sua situação, como recebida, em análise, aprovada ou recusada, conforme as atualizações realizadas na plataforma.

## Tecnologias

| Ferramenta | Uso no projeto |
| :--- | :--- |
| **React** | Construção da interface e dos componentes |
| **Vite** | Ambiente de desenvolvimento e geração da versão de produção |
| **JavaScript** | Lógica e interatividade da aplicação |
| **CSS3** | Estilização e adaptação para diferentes telas |
| **Supabase** | Banco de dados, autenticação e controle de acesso |
| **PostgreSQL** | Armazenamento estruturado das oportunidades e candidaturas |
| **Git e GitHub** | Versionamento e hospedagem do código-fonte |
| **GitHub Pages** | Publicação gratuita da aplicação estática |

## Como funciona

A aplicação foi pensada em torno de três etapas principais:

1. **Descoberta:** a pessoa consulta as oportunidades disponíveis na plataforma.
2. **Candidatura:** após acessar sua conta, a pessoa preenche o formulário e envia sua candidatura.
3. **Acompanhamento:** a candidatura fica registrada no banco de dados, permitindo consultar seu status. As organizações podem visualizar as candidaturas associadas às suas oportunidades e atualizar o andamento conforme as permissões configuradas.

Esse fluxo busca tornar o processo mais transparente e organizado tanto para quem procura oportunidades quanto para quem as disponibiliza.

## Banco de dados e segurança

O projeto utiliza o Supabase para autenticação e persistência dos dados. As principais entidades são:

- **Perfils:** armazenam informações básicas dos usuários e seus tipos de acesso;
- **Vagas:** registram as oportunidades, suas descrições e informações relacionadas;
- **Inscrições:** armazenam as candidaturas, os dados enviados pelo candidato e o status do processo.

O banco utiliza políticas de segurança em nível de linha (Row Level Security — RLS) para restringir o acesso aos dados de acordo com o perfil do usuário e as permissões configuradas.

As credenciais locais são armazenadas em variáveis de ambiente, e o arquivo `.env` não deve ser enviado ao repositório público.

## Estrutura do projeto

A aplicação é organizada a partir dos arquivos principais do React e dos recursos públicos utilizados na interface.

```text
oportuniza-rj/
├── public/
│   ├── favicon-oportuniza.png
│   └── logo-oportuniza.png
├── src/
│   ├── assets/
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   └── supabase.js
├── .env                  # Arquivo local, não publicar
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

## Como executar localmente

### Pré-requisitos

- Node.js e npm instalados;
- Uma conta e um projeto no Supabase;
- O código-fonte do projeto.

**1. Clone o repositório**
```bash
git clone https://github.com/aceakers/oportuniza-rj.git
cd oportuniza-rj
```

**2. Instale as dependências**
```bash
npm install
```

**3. Configure as variáveis de ambiente**
Crie um arquivo `.env` na raiz do projeto e configure os dados de conexão do seu projeto Supabase:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_publica_do_supabase
```
> *Use os valores do seu próprio projeto. Nunca coloque uma chave `service_role` ou outra credencial secreta em variáveis `VITE_*`, pois elas podem ficar acessíveis no navegador.*

**4. Inicie a aplicação**
```bash
npm run dev
```
O Vite exibirá no terminal o endereço local para abrir a aplicação no navegador.

## Publicação

A aplicação será publicada pelo GitHub Pages. O processo de publicação utiliza o build de produção do Vite e o GitHub Actions para disponibilizar os arquivos gerados.

O endereço público ficará no formato:

https://aceakers.github.io/oportuniza-rj/

## Decisões de desenvolvimento

A solução prioriza um fluxo central: consultar oportunidades, registrar candidaturas e acompanhar seus status.

O Supabase foi escolhido para reunir autenticação e persistência dos dados sem exigir a criação de um servidor próprio para o MVP. As políticas de acesso ajudam a separar as permissões de candidatos e organizações.

A interface utiliza React para organizar a aplicação e CSS para controlar a apresentação dos elementos em diferentes tamanhos de tela. O objetivo é manter o projeto simples, funcional e adequado ao escopo do desafio, permitindo futuras melhorias sem tornar a primeira versão desnecessariamente complexa.

## Uso de inteligência artificial

Ferramentas de inteligência artificial foram utilizadas como apoio durante o desenvolvimento, incluindo planejamento da interface, organização de componentes, revisão de estilos, implementação do fluxo de candidaturas e orientação sobre configuração do Supabase e do Git.

- **Planejamento da solução:** Quero desenvolver um MVP chamado Oportuniza RJ para um desafio de tecnologia para impacto social. A plataforma deve conectar pessoas a oportunidades de emprego, estágio e capacitação profissional no Rio de Janeiro. Preciso definir o fluxo principal e implementar apenas as funcionalidades essenciais. *(Objetivo: estruturar a proposta e delimitar o escopo da aplicação).*
- **Interface e responsividade:** Quero desenvolver uma interface em React para uma plataforma de oportunidades, com áreas para candidatos e organizações. Preciso de uma apresentação clara, formulários funcionais e estilos adaptáveis a diferentes tamanhos de tela. *(Objetivo: construir e aprimorar a interface da aplicação).*
- **Banco de dados e autenticação:** Estou desenvolvendo uma aplicação React com Supabase. Preciso estruturar perfis de usuários, oportunidades e candidaturas, implementar autenticação e configurar políticas de acesso para separar as permissões de candidatos e organizações. *(Objetivo: apoiar a implementação da persistência de dados e do controle de acesso).*
- **Candidaturas e acompanhamento:** Quero que uma pessoa consiga se candidatar a uma oportunidade, que os dados sejam salvos no banco e que seja possível acompanhar o status da candidatura. A organização deve conseguir consultar as candidaturas relacionadas às suas oportunidades. *(Objetivo: implementar o fluxo central da plataforma).*
- **Git e publicação:** Estou finalizando um projeto React com Vite e Supabase. Preciso organizar o repositório Git, proteger as variáveis de ambiente e preparar a aplicação para publicação. *(Objetivo: organizar a entrega e preparar o projeto para execução e publicação).*

## Entrega do desafio

O Oportuniza RJ foi concebido para atender aos requisitos centrais do Desafio 03:

- Proposta de solução para um problema social;
- Interface web construída com React;
- Formulário para envio de candidaturas;
- Persistência dos dados no Supabase;
- Fluxo de acompanhamento de candidaturas por status;
- Áreas destinadas a candidatos e organizações;
- Controle de acesso aos dados;
- Código-fonte versionado no GitHub;
- Documentação do projeto e registro do uso de inteligência artificial.

### Links do projeto

- **Repositório:** https://github.com/aceakers/oportuniza-rj
- **Aplicação publicada:** https://aceakers.github.io/oportuniza-rj/

*O link da aplicação estará disponível após configurar e concluir a publicação no GitHub Pages.*

---
<div align="center">
  <strong>Oportuniza RJ</strong><br>
  Feito para o Desafio 03 da KodieAcademy · 2026
</div>