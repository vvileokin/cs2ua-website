### Roster Details<br />
Team Name: ZOTIX<br />
Roster: byr9, EsD<br />
Global Rank: [292](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [192]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  602.6<br />
<br />
Final Rank Value (602.6) = Starting Rank Value (600.0) + Head To Head Adjustments (2.6)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.241[<sup>1</sup>](#table2)
- Bounty Collected: 0.178[<sup>2</sup>](#table1)
- Opponent Network: 0.001[<sup>2</sup>](#table1)
- LAN Wins: 0.000[<sup>2</sup>](#table1)

The average of these factors is 0.105<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 600.0
- 400 + ( ( 0.105 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 600.0


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.029
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent             | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            5 |     2526 | 2026-05-31 | WhiteBIT Academy     | L   | 0.543      | -            | -                | -                | -         |    -5.07 | byr9, EsD, kalyambys, oju, XeNji      |
|            4 |     2537 | 2026-05-31 | LFO UKRAINE          | W   | 0.543      | 0.274        | 0.002 (0.000)    | 0.039 (0.006)    | 0 (0.000) |     8.58 | byr9, EsD, Kalyambys, oju, XeNji      |
|            3 |     4180 | 2026-04-11 | Vexar                | L   | 0.211      | -            | -                | -                | -         |    -2.28 | byr9, EsD, kalyambys, Kingway0, xeNji |
|            2 |     4211 | 2026-04-10 | BankaPEPSI           | W   | 0.204      | 0.278        | 0.000 (0.000)    | 0.041 (0.002)    | 0 (0.000) |     3.32 | byr9, EsD, kalyambys, Kingway0, xeNji |
|            1 |     4235 | 2026-04-09 | ENJOY (Russian team) | L   | 0.198      | -            | -                | -                | -         |    -1.93 | byr9, EsD, kalyambys, Kingway0, xeNji |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($367.88)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-05-31 |      0.543 | $677.00        | $367.88         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
