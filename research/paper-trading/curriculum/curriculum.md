# Trading & Quant Research Curriculum

A curated, honest reading list. Ordered roughly easiest → hardest.
Mark items `[x]` as you finish them and add notes in `notes/`.

## 0. Reality check (read first)
- [ ] Barber & Odean, *"Trading Is Hazardous to Your Wealth"* (2000)
- [ ] Barber et al., *"Day Trading and Learning"* (Taiwan dataset, 2014)
- [ ] Brazilian CVM (2020) retail day-trader outcomes paper
- [ ] Nassim Taleb, *Fooled by Randomness*

## 1. Markets & microstructure
- [ ] Larry Harris, *Trading and Exchanges* (the single best market-structure book)
- [ ] Maureen O'Hara, *Market Microstructure Theory*
- [ ] Irene Aldridge, *High-Frequency Trading*

## 2. Technical analysis — understand what practitioners claim
- [ ] John Murphy, *Technical Analysis of the Financial Markets*
- [ ] Thomas Bulkowski, *Encyclopedia of Chart Patterns* (read with skepticism)
- [ ] Be aware: most TA patterns fail rigorous statistical tests.

## 3. Systematic & quantitative
- [ ] Ernest Chan, *Quantitative Trading* and *Algorithmic Trading*
- [ ] Rishi Narang, *Inside the Black Box*
- [ ] Andrew Pole, *Statistical Arbitrage*
- [ ] Marcos López de Prado, *Advances in Financial Machine Learning* (hard but essential)
- [ ] Marcos López de Prado, *Machine Learning for Asset Managers*

## 4. Risk and statistics
- [ ] Jorion, *Value at Risk*
- [ ] Meucci, *Risk and Asset Allocation*
- [ ] Aaron Brown, *Red-Blooded Risk*

## 5. Practitioner wisdom (war stories, not signals)
- [ ] Jack Schwager, *Market Wizards* series
- [ ] Edwin Lefèvre, *Reminiscences of a Stock Operator*
- [ ] Michael Lewis, *Flash Boys*

## 6. Skill-building exercises to complete in this harness
- [ ] Reproduce buy-and-hold SPY 2010–2024 and verify Sharpe ≈ 0.8–1.0.
- [ ] Show that a 20/50 SMA crossover on SPY *underperforms* buy-and-hold after 5 bps costs.
- [ ] Walk-forward test an RSI strategy across 10 symbols; report how many survive out-of-sample.
- [ ] Compute and plot the equity curve for every strategy in `src/strategies/`.
- [ ] Build a bootstrap confidence interval for your best strategy's Sharpe.
- [ ] Deliberately p-hack a strategy by tuning 20 parameters on in-sample; show it collapses OOS.

## Anti-curriculum — ignore these
- YouTube "day trading gurus" selling courses.
- Discord / Telegram signal groups.
- Anyone claiming a >3 Sharpe with daily bars and retail costs.
