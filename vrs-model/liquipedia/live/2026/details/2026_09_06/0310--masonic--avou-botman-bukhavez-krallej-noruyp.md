### Roster Details<br />
Team Name: MASONIC<br />
Roster: Avou, Botman, Bukhavez, KralleJ, Noruyp<br />
Global Rank: [310](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [202]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  573.4<br />
<br />
Final Rank Value (573.4) = Starting Rank Value (579.1) + Head To Head Adjustments (-5.7)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.187[<sup>1</sup>](#table2)
- Bounty Collected: 0.186[<sup>2</sup>](#table1)
- Opponent Network: 0.001[<sup>2</sup>](#table1)
- LAN Wins: 0.002[<sup>2</sup>](#table1)

The average of these factors is 0.094<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 579.1
- 400 + ( ( 0.094 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 579.1


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.011
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                  |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           14 |     4276 | 2026-04-08 | Persona Grata           | L   | 0.188      | -            | -                | -                | -         |    -3.52 | Avou, Botman, Bukhavez, KralleJ, Noruyp |
|           13 |     4306 | 2026-04-07 | EC BANGA                | W   | 0.182      | 0.384        | 0.000 (0.000)    | 0.000 (0.000)    | 0 (0.000) |     1.53 | Avou, Botman, Bukhavez, KralleJ, Noruyp |
|           12 |     4348 | 2026-04-06 | Bebop                   | L   | 0.175      | -            | -                | -                | -         |    -1.44 | Avou, Botman, Bukhavez, Noruyp, Viggo   |
|           11 |     5136 | 2026-03-27 | Rottweilers             | L   | 0.108      | -            | -                | -                | -         |    -2.03 | Avou, Botman, KralleJ, N4XX1$, Noruyp   |
|           10 |     5258 | 2026-03-24 | Ex-Zero Tenacity        | L   | 0.090      | -            | -                | -                | -         |    -0.37 | Avou, Botman, KralleJ, N4XX1$, Noruyp   |
|            9 |     5353 | 2026-03-23 | Supernova (Danish team) | W   | 0.082      | 0.384        | 0.000 (0.000)    | 0.002 (0.000)    | 0 (0.000) |     0.88 | Avou, Botman, KralleJ, N4XX1$, Noruyp   |
|            8 |     5564 | 2026-03-19 | Ex-Zero Tenacity        | L   | 0.056      | -            | -                | -                | -         |    -0.23 | Avou, Botman, KralleJ, N4XX1$, Noruyp   |
|            7 |     5584 | 2026-03-18 | Supernova (Danish team) | L   | 0.051      | -            | -                | -                | -         |    -1.06 | Avou, Botman, KralleJ, N4XX1$, Noruyp   |
|            6 |     5588 | 2026-03-18 | ENCE                    | L   | 0.051      | -            | -                | -                | -         |    -0.18 | Avou, Botman, Bukhavez, KralleJ, Noruyp |
|            5 |     5647 | 2026-03-17 | OMEGA                   | L   | 0.043      | -            | -                | -                | -         |    -0.03 | Avou, Botman, Bukhavez, KralleJ, Noruyp |
|            4 |     5693 | 2026-03-16 | Supernova (Danish team) | W   | 0.036      | 0.384        | 0.000 (0.000)    | 0.002 (0.000)    | 0 (0.000) |     0.39 | Avou, Botman, Bukhavez, KralleJ, Noruyp |
|            3 |     5767 | 2026-03-14 | Sashi Esport            | L   | 0.024      | -            | -                | -                | -         |    -0.02 | Avou, Botman, KralleJ, N4XX1S, Noruyp   |
|            2 |     5780 | 2026-03-14 | ECSTATIC                | L   | 0.022      | -            | -                | -                | -         |    -0.28 | Avou, Botman, KralleJ, N4XX1S, Noruyp   |
|            1 |     5785 | 2026-03-14 | Sashi Esport            | W   | 0.022      | 0.356        | 0.055 (0.000)    | 0.625 (0.005)    | 1 (0.022) |     0.68 | Avou, Botman, KralleJ, N4XX1S, Noruyp   |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($23.37)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-03-15 |      0.030 | $782.00        | $23.37          |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
