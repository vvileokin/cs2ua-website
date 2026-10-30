### Roster Details<br />
Team Name: WAZABI<br />
Roster: BacH, BangBang, Laykinn, m0vski-, mAnGo<br />
Global Rank: [220](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [150]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  680.7<br />
<br />
Final Rank Value (680.7) = Starting Rank Value (704.1) + Head To Head Adjustments (-23.4)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.242[<sup>1</sup>](#table2)
- Bounty Collected: 0.257[<sup>2</sup>](#table1)
- Opponent Network: 0.014[<sup>2</sup>](#table1)
- LAN Wins: 0.127[<sup>2</sup>](#table1)

The average of these factors is 0.160<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 704.1
- 400 + ( ( 0.160 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 704.1


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.064
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                  | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                  |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           18 |     2584 | 2026-05-30 | Drip Too Hard             | L   | 0.536      | -            | -                | -                | -         |    -7.09 | BacH, BangBang, Laykinn, m0vski-, mAnGo |
|           17 |     2631 | 2026-05-29 | Atreides                  | L   | 0.528      | -            | -                | -                | -         |    -5.54 | BacH, BangBang, Laykinn, m0vski-, mAnGo |
|           16 |     2661 | 2026-05-28 | Drip Too Hard             | W   | 0.523      | 0.384        | 0.001 (0.000)    | 0.357 (0.072)    | 0 (0.000) |     8.93 | BacH, BangBang, Laykinn, m0vski-, mAnGo |
|           15 |     2683 | 2026-05-28 | Wampirki                  | L   | 0.521      | -            | -                | -                | -         |   -12.01 | BacH, BangBang, Laykinn, m0vski-, mAnGo |
|           14 |     2833 | 2026-05-24 | Entropy Gaming            | L   | 0.495      | -            | -                | -                | -         |    -8.40 | BacH, BangBang, Laykinn, m0vski-, mAnGo |
|           13 |     3814 | 2026-04-26 | MASONIC                   | L   | 0.308      | -            | -                | -                | -         |    -2.54 | BacH, BangBang, Laykinn, m0vski-, VireZ |
|           12 |     3847 | 2026-04-25 | IMMAPROBLEM               | W   | 0.304      | 0.322        | 0.000 (0.000)    | 0.000 (0.000)    | 1 (0.304) |     1.46 | BacH, BangBang, Laykinn, m0vski-, VireZ |
|           11 |     4164 | 2026-04-12 | Entropy Gaming            | L   | 0.216      | -            | -                | -                | -         |    -3.78 | BacH, BangBang, Laykinn, m0vski-, VireZ |
|           10 |     4166 | 2026-04-12 | Esport Academy Copenhagen | L   | 0.216      | -            | -                | -                | -         |    -0.50 | BacH, BangBang, Laykinn, m0vski-, VireZ |
|            9 |     4186 | 2026-04-11 | Entropy Gaming            | W   | 0.210      | 0.341        | 0.001 (0.000)    | 0.100 (0.007)    | 1 (0.210) |     2.94 | BacH, BangBang, Laykinn, m0vski-, VireZ |
|            8 |     4194 | 2026-04-11 | SAW Youngsters            | W   | 0.208      | 0.341        | 0.002 (0.000)    | 0.473 (0.034)    | 1 (0.208) |     3.67 | BacH, BangBang, Laykinn, m0vski-, VireZ |
|            7 |     4745 | 2026-04-01 | Falcons Force             | L   | 0.142      | -            | -                | -                | -         |    -2.17 | BacH, BangBang, Laykinn, m0vski-, VireZ |
|            6 |     4755 | 2026-04-01 | 3DMAX                     | L   | 0.141      | -            | -                | -                | -         |    -0.16 | BacH, BangBang, Laykinn, m0vski-, VireZ |
|            5 |     4784 | 2026-03-31 | Z7 Esports                | W   | 0.138      | 0.341        | 0.000 (0.000)    | 0.005 (0.000)    | 1 (0.138) |     0.69 | BacH, BangBang, Laykinn, m0vski-, VireZ |
|            4 |     4792 | 2026-03-31 | Máquinas                  | W   | 0.137      | 0.341        | 0.000 (0.000)    | 0.000 (0.000)    | 1 (0.137) |     0.66 | BacH, BangBang, Laykinn, m0vski-, VireZ |
|            3 |     4815 | 2026-03-31 | AM Gaming                 | L   | 0.136      | -            | -                | -                | -         |    -2.12 | BacH, BangBang, Laykinn, m0vski-, VireZ |
|            2 |     4840 | 2026-03-31 | B8                        | W   | 0.136      | 0.341        | 0.263 (0.012)    | 0.572 (0.026)    | 1 (0.136) |     4.22 | BacH, BangBang, Laykinn, m0vski-, VireZ |
|            1 |     4856 | 2026-03-31 | Phantom Esports           | L   | 0.135      | -            | -                | -                | -         |    -1.68 | BacH, BangBang, Laykinn, m0vski-, VireZ |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($382.04)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-04-12 |      0.217 | $1,759.11      | $382.04         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
