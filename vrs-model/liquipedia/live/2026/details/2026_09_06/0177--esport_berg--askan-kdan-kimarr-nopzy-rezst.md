### Roster Details<br />
Team Name: Esport BERG<br />
Roster: Askan, kdaN, KiMaRR, nopzy, Rezst<br />
Global Rank: [177](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [127]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  735.6<br />
<br />
Final Rank Value (735.6) = Starting Rank Value (792.3) + Head To Head Adjustments (-56.7)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.242[<sup>1</sup>](#table2)
- Bounty Collected: 0.230[<sup>2</sup>](#table1)
- Opponent Network: 0.026[<sup>2</sup>](#table1)
- LAN Wins: 0.328[<sup>2</sup>](#table1)

The average of these factors is 0.206<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 792.3
- 400 + ( ( 0.206 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 792.3


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.124
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent         | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                               |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           13 |      242 | 2026-08-30 | Azuolas          | L   | 1.000      | -            | -                | -                | -         |   -10.63 | Askan, kdaN, KiMaRR, nopzy, Rezst    |
|           12 |      264 | 2026-08-30 | WhiteBIT Academy | L   | 1.000      | -            | -                | -                | -         |   -13.23 | Askan, kdaN, KiMaRR, nopzy, Rezst    |
|           11 |      720 | 2026-08-17 | ENCE             | L   | 1.000      | -            | -                | -                | -         |   -11.62 | Askan, kdaN, KiMaRR, nopzy, Rezst    |
|           10 |      739 | 2026-08-16 | Mai tai          | L   | 1.000      | -            | -                | -                | -         |   -22.43 | Askan, kdaN, KiMaRR, nopzy, Rezst    |
|            9 |      749 | 2026-08-16 | HAVU             | L   | 1.000      | -            | -                | -                | -         |   -14.29 | Askan, kdaN, KiMaRR, nopzy, Rezst    |
|            8 |      841 | 2026-08-13 | Saint Sinners    | W   | 1.000      | 0.344        | 0.007 (0.002)    | 0.505 (0.174)    | 0 (0.000) |    15.53 | Askan, kdaN, KiMaRR, nopzy, Rezst    |
|            7 |      857 | 2026-08-12 | Permitta Esports | L   | 1.000      | -            | -                | -                | -         |   -15.88 | Askan, kdaN, KiMaRR, nopzy, Rezst    |
|            6 |     1938 | 2026-06-29 | SINQU Esports    | W   | 0.737      | 0.303        | 0.004 (0.001)    | 0.169 (0.038)    | 1 (0.737) |    11.61 | Askan, CrePoW, KiMaRR, Rezst, Tree60 |
|            5 |     1945 | 2026-06-29 | Leo Team         | L   | 0.736      | -            | -                | -                | -         |    -7.83 | Askan, CrePoW, KiMaRR, Rezst, Tree60 |
|            4 |     1952 | 2026-06-29 | Aimhaus          | W   | 0.735      | 0.303        | 0.000 (0.000)    | 0.028 (0.006)    | 1 (0.735) |     2.59 | Askan, CrePoW, KiMaRR, Rezst, Tree60 |
|            3 |     1958 | 2026-06-28 | 6666             | W   | 0.731      | 0.303        | 0.000 (0.000)    | 0.024 (0.005)    | 1 (0.731) |     2.63 | Askan, CrePoW, KiMaRR, Rezst, Tree60 |
|            2 |     1962 | 2026-06-28 | ASTRAL Esports   | L   | 0.731      | -            | -                | -                | -         |    -5.28 | Askan, CrePoW, KiMaRR, Rezst, Tree60 |
|            1 |     1966 | 2026-06-28 | SINQU Esports    | W   | 0.730      | 0.303        | 0.004 (0.001)    | 0.169 (0.037)    | 1 (0.730) |    12.17 | Askan, CrePoW, KiMaRR, Rezst, Tree60 |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($368.45)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-06-29 |      0.737 | $500.00        | $368.45         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
