### Roster Details<br />
Team Name: Washed (Danish team)<br />
Roster: ANSG1, kiR, kroK, Lucky, suma<br />
Global Rank: [140](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [107]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  822.6<br />
<br />
Final Rank Value (822.6) = Starting Rank Value (795.2) + Head To Head Adjustments (27.3)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.326[<sup>1</sup>](#table2)
- Bounty Collected: 0.214[<sup>2</sup>](#table1)
- Opponent Network: 0.010[<sup>2</sup>](#table1)
- LAN Wins: 0.281[<sup>2</sup>](#table1)

The average of these factors is 0.208<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 795.2
- 400 + ( ( 0.208 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 795.2


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.098
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent              | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                        |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            5 |     2205 | 2026-06-13 | MASONIC               | W   | 0.630      | 0.357        | 0.006 (0.001)    | 0.209 (0.047)    | 1 (0.630) |    11.96 | ANSG1, kiR, kroK, Lucky, suma |
|            4 |     2219 | 2026-06-13 | MASQ                  | W   | 0.629      | 0.357        | 0.001 (0.000)    | 0.048 (0.011)    | 1 (0.629) |     7.25 | ANSG1, kiR, kroK, Lucky, suma |
|            3 |     2240 | 2026-06-13 | Ex-Sashi Academy      | W   | 0.628      | 0.357        | 0.001 (0.000)    | 0.188 (0.042)    | 1 (0.628) |     7.58 | ANSG1, kiR, kroK, Lucky, suma |
|            2 |     2254 | 2026-06-12 | WOPA Esport           | L   | 0.624      | -            | -                | -                | -         |    -4.97 | ANSG1, kiR, kroK, Lucky, suma |
|            1 |     2260 | 2026-06-12 | Invicta (Danish team) | W   | 0.624      | 0.357        | 0.001 (0.000)    | 0.019 (0.004)    | 1 (0.624) |     5.53 | ANSG1, kiR, kroK, Lucky, suma |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($4,400.47)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.01) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-06-13 |      0.630 | $6,980.00      | $4,400.47       |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
