### Roster Details<br />
Team Name: QuantumX<br />
Roster: Cozen, grizzly, Kamui, Paranormal, soloooS<br />
Global Rank: [300](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Asia]( ../../standings_asia_2026_09_06.md)<br />
Regional Rank: [34]( ../../standings_asia_2026_09_06.md)<br />
<br />
Final Rank Value:  592.2<br />
<br />
Final Rank Value (592.2) = Starting Rank Value (613.7) + Head To Head Adjustments (-21.5)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.230[<sup>1</sup>](#table2)
- Bounty Collected: 0.204[<sup>2</sup>](#table1)
- Opponent Network: 0.006[<sup>2</sup>](#table1)
- LAN Wins: 0.010[<sup>2</sup>](#table1)

The average of these factors is 0.112<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 613.7
- 400 + ( ( 0.112 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 613.7


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.054
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                  | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                     |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           23 |      463 | 2026-08-26 | The KnockoutX             | L   | 1.000      | -            | -                | -                | -         |   -19.82 | grizzly, Kamui, me1o, Paranormal, soloooS  |
|           22 |      510 | 2026-08-25 | Alter Ego                 | L   | 1.000      | -            | -                | -                | -         |    -8.74 | grizzly, Kamui, me1o, Paranormal, soloooS  |
|           21 |     3654 | 2026-04-29 | Rare Atom                 | L   | 0.329      | -            | -                | -                | -         |    -3.83 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|           20 |     3695 | 2026-04-28 | Banzai                    | W   | 0.323      | 0.333        | 0.001 (0.000)    | 0.050 (0.005)    | 0 (0.000) |     5.77 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|           19 |     3738 | 2026-04-27 | Sensation                 | W   | 0.316      | -            | -                | -                | 0 (0.000) |     4.37 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|           18 |     3798 | 2026-04-26 | Alter Ego                 | L   | 0.309      | -            | -                | -                | -         |    -6.74 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|           17 |     4340 | 2026-04-06 | Banzai                    | L   | 0.176      | -            | -                | -                | -         |    -2.44 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|           16 |     4387 | 2026-04-05 | Just Swing (Chinese team) | W   | 0.169      | 0.333        | 0.003 (0.000)    | 0.268 (0.015)    | 0 (0.000) |     3.24 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|           15 |     4465 | 2026-04-04 | BORING PLAYER             | W   | 0.163      | 0.333        | 0.000 (0.000)    | 0.058 (0.003)    | 0 (0.000) |     2.71 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|           14 |     4543 | 2026-04-03 | The KnockoutX             | L   | 0.156      | -            | -                | -                | -         |    -3.25 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|           13 |     4647 | 2026-04-02 | Vitalem Aerem Gaming      | W   | 0.149      | 0.333        | 0.000 (0.000)    | 0.184 (0.009)    | 0 (0.000) |     2.92 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|           12 |     5215 | 2026-03-25 | Alter Ego                 | L   | 0.096      | -            | -                | -                | -         |    -1.02 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|           11 |     5263 | 2026-03-24 | BORING PLAYER             | W   | 0.090      | 0.333        | 0.000 (0.000)    | 0.058 (0.002)    | 0 (0.000) |     1.53 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|           10 |     5344 | 2026-03-23 | Kaleido Gaming            | W   | 0.083      | 0.333        | 0.006 (0.000)    | 0.267 (0.007)    | 0 (0.000) |     1.71 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|            9 |     5397 | 2026-03-22 | 5star eSports             | W   | 0.076      | 0.333        | 0.008 (0.000)    | 0.323 (0.008)    | 0 (0.000) |     1.93 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|            8 |     5458 | 2026-03-21 | Chinggis Warriors         | W   | 0.070      | 0.333        | 0.006 (0.000)    | 0.118 (0.003)    | -         |     1.55 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|            7 |     5514 | 2026-03-20 | FengDa Gaming             | L   | 0.063      | -            | -                | -                | -         |    -0.94 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|            6 |     5531 | 2026-03-19 | 5star eSports             | L   | 0.061      | -            | -                | -                | -         |    -0.38 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|            5 |     5572 | 2026-03-18 | NEXVOID                   | L   | 0.054      | -            | -                | -                | -         |    -0.51 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|            4 |     5617 | 2026-03-17 | FullW (Mongolian team)    | L   | 0.048      | -            | -                | -                | -         |    -0.87 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|            3 |     5619 | 2026-03-17 | The Huns Esports          | W   | 0.047      | 0.354        | 0.025 (0.000)    | 0.363 (0.006)    | 1 (0.047) |     1.17 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|            2 |     5656 | 2026-03-17 | Banzai                    | L   | 0.042      | -            | -                | -                | -         |    -0.58 | Cozen, grizzly, Kamui, Paranormal, soloooS |
|            1 |     5666 | 2026-03-16 | Banzai                    | W   | 0.040      | 0.354        | 0.001 (0.000)    | 0.050 (0.001)    | 1 (0.040) |     0.72 | Cozen, grizzly, Kamui, Paranormal, soloooS |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($232.92)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-03-27 |      0.110 | $1,000.00      | $109.68         |
| 2026-03-20 |      0.062 | $2,000.00      | $123.24         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
