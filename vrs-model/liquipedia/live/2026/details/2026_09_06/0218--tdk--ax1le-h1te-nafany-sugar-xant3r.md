### Roster Details<br />
Team Name: TDK<br />
Roster: Ax1Le, h1te, nafany, sugaR, Xant3r<br />
Global Rank: [218](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [149]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  685.6<br />
<br />
Final Rank Value (685.6) = Starting Rank Value (665.2) + Head To Head Adjustments (20.4)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.248[<sup>1</sup>](#table2)
- Bounty Collected: 0.217[<sup>2</sup>](#table1)
- Opponent Network: 0.019[<sup>2</sup>](#table1)
- LAN Wins: 0.074[<sup>2</sup>](#table1)

The average of these factors is 0.139<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 665.2
- 400 + ( ( 0.139 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 665.2


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


| Match Played | Match ID | Date       | Opponent         | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                              |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           11 |     4292 | 2026-04-07 | UPGRADE Team     | W   | 0.184      | 0.276        | 0.013 (0.001)    | 0.762 (0.039)    | 1 (0.184) |     5.19 | Ax1Le, h1te, nafany, sugaR, Xant3r  |
|           10 |     4312 | 2026-04-07 | UPGRADE Team     | W   | 0.181      | 0.276        | 0.013 (0.001)    | 0.762 (0.038)    | 1 (0.181) |     5.14 | Ax1Le, h1te, nafany, sugaR, Xant3r  |
|            9 |     4450 | 2026-04-04 | Color            | L   | 0.163      | -            | -                | -                | -         |    -0.77 | Ax1Le, h1te, nafany, sugaR, Xant3r  |
|            8 |     4614 | 2026-04-02 | SPARTA Esports   | W   | 0.151      | 0.435        | 0.011 (0.001)    | 0.907 (0.059)    | 1 (0.151) |     3.60 | Ax1Le, h1te, nafany, sugaR, Xant3r  |
|            7 |     4633 | 2026-04-02 | Eternal premium  | W   | 0.150      | 0.435        | 0.000 (0.000)    | 0.176 (0.011)    | 1 (0.150) |     2.18 | Ax1Le, h1te, nafany, sugaR, Xant3r  |
|            6 |     5246 | 2026-03-24 | Black Phoenix    | L   | 0.091      | -            | -                | -                | -         |    -0.66 | Ax1Le, nafany, sugaR, Xant3r, zorte |
|            5 |     5323 | 2026-03-23 | Permitta Esports | W   | 0.084      | 0.384        | 0.007 (0.000)    | 0.692 (0.022)    | 0 (0.000) |     1.91 | Ax1Le, nafany, sugaR, Xant3r, zorte |
|            4 |     5387 | 2026-03-22 | HAVU             | W   | 0.077      | 0.384        | 0.004 (0.000)    | 0.375 (0.011)    | 0 (0.000) |     1.84 | Ax1Le, nafany, sugaR, Xant3r, zorte |
|            3 |     5440 | 2026-03-21 | Team Nemesis     | L   | 0.071      | -            | -                | -                | -         |    -0.16 | Ax1Le, nafany, sugaR, Xant3r, zorte |
|            2 |     5542 | 2026-03-19 | Rebels Gaming    | W   | 0.058      | 0.384        | 0.003 (0.000)    | 0.214 (0.005)    | 0 (0.000) |     1.29 | Ax1Le, nafany, sugaR, Xant3r, zorte |
|            1 |     5646 | 2026-03-17 | HYPERSPIRIT      | W   | 0.043      | 0.384        | 0.002 (0.000)    | 0.426 (0.007)    | 0 (0.000) |     0.86 | Ax1Le, nafany, sugaR, Xant3r, zorte |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($464.88)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-04-07 |      0.184 | $1,080.00      | $198.65         |
| 2026-04-05 |      0.170 | $750.00        | $127.74         |
| 2026-03-27 |      0.111 | $1,250.00      | $138.48         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
