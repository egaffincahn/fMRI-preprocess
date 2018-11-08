
HELP files for preprocessing script  

Beware: I updated this from .txt to .md and looked for all the formatting problems I could find, but if there is a sentence that seems to be missing a word or has odd formatting, it's probably a markdown issue, so check the raw .md file.  

# Updates

4/2013 EG Gaffin-Cahn  
5/22/2013 update  
8/13/2013 moving files  
8/15/2013 surface space MDM  
8/16/2013 raw data folder structure  
9/23/2013 SDM parsing bugs  
11/4/2013 SGS bug during FMR step, spaces in the path folder column of the subject table are now OK, regexp bug for finding subject-level processed folders, now looks for any PRT in processed folder if none is attached to the VTC  
11/5/2013 model motion as predictor (instead of confound)  
11/6/2013 saving VTC with new PRT linked when making SDMs  
11/18/2013 error checking in move pages, kid vs sub option added, PRT naming scheme more flexible, OS now asks explicitly in MDM tab, checks for missing dicoms, MoveFiles.txt updated to include kid vs sub  
11/19/2013 setup of choosing the location of the raw data to move files updated and included in MoveFiles.txt, PRT naming scheme (and drop-down), README formatting, debugged  
11/25/2013 option to use separate IA and FA for each run when making VTCs, option to have some of PRT conditions as confounds  
11/26/2013 when making VTCs, takes out any underscores in the experiment name or between the experiment name and subject number, and does some checking elsewhere to make sure you don't have underscores  
12/13/2013 if the number of rows in the move files table was different across pages, the table with fewer rows had inappropriately entered info in the extra rows, fixed some other problems with empty spots in the move files table  
12/26/2013 sped up process to count how many dicoms in new fmr project; creating fmr project now correctly takes argument for number of slices per volume, not number of slices per dicom  
1/8/2014 changed the preprocess tab's save/load table functions into save/load all the settings in all tabs, and added an option to load the defaults; got rid of weird extraneous field vtcDecisionButton  
1/9/2014 fixed bugs in removing underscores, saving settings file  
1/17/2014 stops making a bunch of folders when the path is wrong in the subject table; put in some checks and warnings to make sure that the path in the subject table is correct  
1/23/2014 fixed bug where it looks for bvError even though no error was caught; fixed some problems with getting the folder structure when moving files, such as creation of new directories  
4/1/2014 fixed the log output  
4/3/2014 fixed some folder checking for sdms, mdms, mtcs, which don't necessarily need anatomy and funcdicoms folders; fixed parametric weights from prts  
4/10/2014 folder checking for mtcs; looking for the right files during mtc creation  
4/10/2014 additional folder check - make sure the path directory in the subject table exists! added saving of all the parameters in the GUI to the output log file, so that now the output log file can act as a file to load up old parameters  
4/22/2014 fixed issue with closing fmr files after prt linking, checks to make sure tal template exists if you're using it, updated some functionality for 2.8.2 (such as timeoutmessagebox)  
5/1/2014 SDM and MDM projects need anatomy folder when using surface space for MDMs  
5/5/2014 Looking for tal template for VTCs  
5/6/2014 Added a new mode (index 2) to findFile to return all matching files (instead of just the first one or just the longest named one)  
5/13/2014 PRT naming scheme moved out to apply for all steps  
5/19/2014 Fixed a VTC-SDM combined session bug  
6/19/2014 Changed default FMR slice time correction slice order to ascending interleaved even-odd (from odd-even)  

# Contents:

1. Files to run the script
2. Folder sub-structures
3. Running the script
4. The GUI
5. Preprocessing steps

# Section 1: Files to run the script

There are two files that are needed to operate the preprocessing script: a .js (Java script) and a .ui (user interface) script. The .js file is written in Java and interacts with BrainVoyager. The .ui file was developed in QtCreator and acts as the interface between the GUI and the .js.  

The Java script has line-by-line comments for nearly all statements and commands. It utilizes two important Java objects. The first is BrainVoyagerQX, which is built-in for running the script through BrainVoyager and includes methods (methods are functions that can be called for a specific to Java object) to preprocess and interact with the software. The next important object, procObj (processing object), carries the GUI and all of its widgets and functions. Through a series of variable creations, manipulations, and calls to both objects, the raw data is loaded up, manipulated in the manner desired, and saved out, all in a very rigid (but fairly intuitive, I hope), streamlined fashion. The script frequently interacts with the processing object to assess the current state of the widgets, which includes check boxes, drop-down lists, and scrollers. By doing so, it can determine the user's desired settings and act on them appropriately to do the proper transformations and corrections of the raw data.  

The .ui file contains, within the main dialog box, all of the widgets and sub-widgets. Each item, box, or group has a set of properties that can be altered with interaction by the .js, and functions that allow interactions with other items in the dialog box. For example, the FMR project motion correction check box can be toggled. When the user toggles it, that change is picked up by the .js, which reads the current properties or states (is the box checked or unchecked?), and then the .js alters the state of enablement of the entire motion correction field, which includes many specific parameters. The OK button interacts with the .js in such a way that all the current properties are read and then used to do the preprocessing.  

# Section 2: Folder sub-structure

The precision of the sub-structure of all the data folders is a necessity to running the script. The script looks in certain folders and sub-folders for certain files, and if anything is not where it should be, the script will not be able to do its job. The correct folder structure should be as follows, with increasing indentation representing deeper sub-folder level:


RAW DATA FOLDER STRUCTURE:

\<Encompassing Folder\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<ExperimentName\>\<ExperimentNumber\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<YYYMMDD\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;X\<SessionName\>  

Notes:  
• Experiment Name: This is the name of the umbrella experiment and the last part of the path name for your output folder path. Nothing else should be included in this folder name and it should not include any special characters. It is not the same as the individual experiment name, which is not included anywhere in the raw data folder structure; it is named by you and the appropriate raw data session is placed into that experiment name sub-folder.  
• Experiment Number: This is the subject number and is called just that in the field in your Move Files Pages (see below).  
• Session Name: The name of this is entirely irrelevant, but the number at the beginning is retrieved, and is represented by the first column in your Move Files Table (see below). Specifically, this is the scanner run number (but not the experiment run number). It cannot have anything before the number.  


YOUR PERSONAL FOLDER STRUCTURE:

\<Encompassing Folder\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Anatomy  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SubX  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<DICOMs\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<VMRs\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<ExperimentName\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<ExperimentName\>\_PRTs  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;FuncDicoms  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SubX  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;RunX  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<DICOMs\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<FMRs\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ProcessedData_Unsmoothed  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ProcessedData_SmoothedXFWHM  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SubX  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;RunX  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<VTCs\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<SDMs\>  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<MTCs\>  

Notes:  
• Experiment Name: This is the name of the experiment. Nothing else should be included in this folder name and it should not include any special characters  
• Experiment PRTs: must be exact as shown above; ExperimentName must be the same for the PRT folder and the dicom folder. The PRTs must be named \*\<ExperimentName\>\*\_\*\<ParticipantType\>XXX\*\_\*RunX\*.prt, where the \* represents ANY character and \<ParticipantType\> is Sub, Kid, or Adult, as chosen in the FMR tab. There may be any number of zeros between Sub and the subject number, as well as Run and the run number. Here, the subject number can be two things - the experiment-specific ID that starts at 1 and goes to however many subjects did the experiment, or the individual's unique fMRI ID. The one you want must be set in the FMR tab > General Settings section. Also, make sure that experiment name is the same as the Experiment Folder Name, and that it is followed by an underscore.  
• Subject (Dicoms and Processed): folder for each subject, can be Sub1, Sub01, 20130419_Sub001_blah, or any combination; the important thing is that there are only 0s between "Sub" and the subject number and than any character that follows the subject number is not also a number, obviously.  
• Subject (Anatomy): When looking for raw anatomical files to preprocess, no experiment name will be given, so the script will search for the subject number somewhere in the subject-level anatomy folder followed by the subject's unique fMRI ID (ex. 20130813_PolarAngle23_Eccentricity41_Sub251). When searching for previously preprocessed anatomical files (as in the case of VTC or MTC creation), the script will search for \<ExperimentName\>\<Subject Number\> (ex. IsoRetino10) to find the subject-level anatomy folder. This folder name can have anything before but not after the name/number combination, but can only have 0s in between name and number.  
• Run: Run1, 20130419_Run01, same naming convention as the dicoms/processed data subject folders  

# Section 3: Running the script

The scripts should run on BrainVoyagerQX 2.4 or higher, however there may be minor bugs that do not interfere with actual data analysis up to 2.8. In addition, it can be run on both Mac and Windows. The most recent versions of the script are located in cantlonData/GENERAL_RESOURCES/OtherScripts/Java/, but to run, the .ui and .js need to be located in cantlonUsers/\<username\>/Documents/BVQXExtensions/Scripts/. In later versions of BrainVoyager, however, you can change your default scripts folder, which may make it easier to have easy access to the most updated versions of all scripts in the GENERAL_RESOURCES folder.  
	
Open BrainVoyager and navigate to the Scripts tab. Unfortunately, because the script interacts with a .ui, you can't just run the .js directly from the Scripts tab. Instead, click Edit and Run Scripts. This will bring up an interface to debug and/or run the .js files in your scripts folder. Click on the Preprocess.js file and click Run. This will open the GUI that allows you to set your parameters. In earlier versions of BrainVoyager, running the script dialog sometimes occludes the GUI, even when it pops up. Additionally, if you run the script multiple times in the same session of BrainVoyager (without quitting in between), BrainVoyager will crash unless you reload the .js by simply re-clicking it from the list on the left of the debugging/script running interface.  
	
Everything that the script writes to the log will also be written out into a text file that gets saved for your reference. What does not get included in this is some of the log information that BrainVoyager automatically writes during the BVQX function calls. We don't have access to that, so it doesn't get written out into the file. The file is named for the date and time it was written and the scripting steps that you completed, whether it was moving files, preprocessing, or both. This file can also act as a parameters saver when you want to load up previously used settings (see Section 4: General).  

# Section 4: The GUI

Once you've got the GUI opened, you have the option to enter all the settings that are available through BrainVoyager's preprocessing scripting functions. There may be (slightly) decreased functionality by doing it through scripting, but it saves lots of time by not having to process each run individually. At the bottom left of the GUI is a drop-down list of different participant types - Sub, Kid, and Adult. These correspond to to what your subject-level anatomy and func dicoms folders will be named (as well as the processed data folder later on). This decision will also determine how the script looks for your PRTs.  

### Moving files  

You have the ability to move files directly from the server to a location of your choosing. The overall setup of this tab is as follows: All raw data session folders must be found in the umbrella directory given by Location of Raw Data. Each session or subject that you want to move is represented by a single Page, and you can scroll through each of your pages, adding new blank and duplicate ones. For each page, you must specify the session's folder within the Raw Data umbrella directory, Raw Data Experiment Name, the experiment subject number (for finding the raw data), the subject's unique fMRI ID (for creating a new folder with the moved data), an Output Path which is equivalent to the Encompassing Folder shown in the folder structure above, and optionally, a date, if there are more than one sessions for a single subject. Each Page will also have a table. The columns are as follows:  
1. Scan sequence number. That is, each session will have several sub-folders, one for each run (MPRAGE, BOLD, BOLD, etc.). The number you provide in the column is the scan number found at the beginning of that sub-folder (ex. for "3.ep2d_bold" you provide "3").  
2. Experiment name. If it does not exist already, a folder will be created with the text in this cell represented by \<ExperimentName\> in the folder structure. If you are moving anatomical files, simply put "Anatomy," and it will put it in the correct spot. The naming of the subject-level anatomical folders is done by taking all of experiment names in the table (you can have as many different experiment names as there are rows), alphabetize them, add the experiment subject number, fMRI ID number, date (given by the session date in the raw data folders), and concatenate them (ex. 20130731_Eccentricity35_PolarAngle35_Resting35_Sub306).  

### Preprocessing

At the top of the GUI, there is a table that will include subject numbers and folder paths. The script scrolls through each row, so all columns in a single row are grouped together. Columns are as follows:  
1. The first column is the experiment subject number. These numbers correspond to the subject numbers in the subject-level folders in the FuncDicoms or ProcessedData folder; they are NOT indices. Typing 1 and 01 have the same effect because it is read in as a string and converted to a number, so any preceding 0s will be lopped off. The script looks for a subject-level folder name that contains "Sub", followed by any number of 0s, followed by the sub number in the text box. So, if your folder is named Sub001 and you type 1, it will get the folder correctly. You may also write a series of numbers such as "1-15" if you want to analyze each subject number in that series.  
2. However, this is contingent on either on column 2, which is for the unique fMRI ID number. All those subjects 1-15 must have the same unique fMRI ID or the preprocessing step you are performing does not require the fMRI ID (to find out if your step needs it, see the help section for that step). You cannot put two separate series (ex: 1-12,14-19) - you have to put them in separate rows.  
3. The final column is the path that is specific to your preprocessing step. You can enter it manually or browse to it by double-clicking (sometimes its responsiveness is finicky so try navigating away and then back again). Depending on if you are making FMRs, VMRs, VTCs, etc., you will need to put in the path to the anatomy folder, experiment-level folder, preprocessed data folder, etc. See the help section for your preprocessing step to see what it needs. Additionally, when you double-click the cell to open the directory browser, the header will tell you what to navigate to based on the current tab selected. Be aware that BrainVoyager path names use the Mac convention of forward slashes ("/") regardless of platform, but this does not pose any known problems. If all subject's analyses are for the same experiment, you have the option to only enter the path on the first row and leave the rest blank. Because of that, if you are processing data for multiple subjects in two experiments, you can leave blank the path for each subject that is not the first subject of that experiment (ex: Subs 2; 4; 2; 6 and paths to experiment A, blank, B, blank).  

### General

Additionally, you have the option of saving and loading a the settings in the tabs and the subject table simultaneously. Saving a table for later use will save out "Preprocess_Settings.txt" in the path folder column of the first row. You can also load a text file (that must have the correct format, see Example_Settings.txt for a guide. The subject table format: first line includes the number of rows for the table. Subsequent lines are simply tab-delimited values that will go in each column), or load the defaults, which are what you see when you start up the script. If you have previously run the script, a log file will have been saved out which includes all of your parameters that you used. You can load up that file instead of a Preprocess_Settings.txt file to load in the subject table and settings.  

Below of the subject table, there is a line to use a template Talairached brain for use in the VTC and MTC projects steps. Below that, there are tabs that correspond to which processing step you want to do. The only one that will run is the tab that is highlighted when you press OK to start, although some of the steps allow you to piggy-back later steps on to the current analysis. In the case that the two consecutive steps you are running require different paths in the subject table, put the correct information for the primary (first) step. Click Default to reload the default values (this is not live yet), then click OK to start the preprocessing or analysis. BrainVoyager's log box at the bottom will have lots of information that is printed out through the duration of the analyses, although it sometimes scrolls through fairly quickly, so it may be beneficial to increase the size of the log before starting the script (once you press OK, you will not be able to do so). If an error occurs in any of the preparatory steps, it will display the error in this log box and stop the process. However, if the error is during a processing step, it notes the error, skips that run (because subsequent processes for the same run will just compound more errors) and will give you a summary of those issues at the end of the script, along with the organization/syntax in which the errors are displayed.  

# Section 5: Preprocessing steps

### FMR

The FMR tab creates the FMR project. This section has by far the most number of parameters and optional settings. The only section of it that is required is the General FMR Project Settings. Here options like number of volumes to skip, number of slices in each dicom, etc. are all mandatory, and will define how the FMR project is created. After that, there are five groups of optional settings, and they may be toggled on and off with the checkboxes. Within each of them, editing the settings is straightforward. The script will find your PRTs and link the appropriate one to the FMR. See Section 2 Personal Folder Structure Notes for more information about PRT naming.  
• fMRI IDs necessary: Yes  
• Subject Table path: Experiment folder  

### VMR

This creates the VMR project. You have the option of performing the isovoxel transformation, the transformation to saggital slices, inhomogeneity correction, as well as an automated, combined ACPC and TAL transformation step. If you are automating the Talairached brain, it is imperative that you check every TAL brain it made after it is done to make sure that it did a good job. In my experience, it either does a fantastic job, or it doesn't work at all. The subject table path cell requires the general anatomy folder for all subjects. BEWARE: BrainVoyager cannot yet script conversion into saggital slices and then reorient between neurological and radiological convention. Therefore, performing the Transform to Saggital Orientation step may lead your data to be flipped saggitally.  
• fMRI IDs necessary: Yes  
• Subject Table path: Anatomy folder  

### VTC

Creating VTCs requires that you have created your FMR project, as well as your anatomical project, to which your functional data has already been coregistered. You have the option of creating VTCs on FMR data that has been spatial smoothed or not (or both). The spatial Gaussian smoothing performs the same steps as that listed in the FMR tab, but performing it here instead gives more flexibility when creating the VTCs by splitting them in separate processed data folders. Based on the number of types of VTCs you make, you will have one folder for unsmoothed FMRs, and another for each full-width half maximum (FWHM) smoothed data.  

There is a box to create SDMs and MTCs as well. If you chose to do so, all the parameters of appropriate tab(s) apply, with one exception: You cannot make VTC-SDM-MDM in the same step. The SDMs or MTCs will be created at each run after VTC creation. Read the SDM/MTC section for more info.  

If all of the necessary files to create VTCs are already in the processed data folder that you'll be placing new VTCs in, the script will not copy the files again from FuncDicoms and the anatomy in order to both save time and avoid requiring the existence of the FuncDicoms folder, etc. to make the VTCs because you already have the files necessary.  

You have the option of using a template TAL brain to create the VTCs. To do so, check the appropriate box and navigate to the directory with the TAL.vmr brain. That file MUST end in \*TAL.vmr in order for the script to find it, and this is true even if you are not using a template brain.  

If your FMRs have PRTs linked to them, the VTCs will inherit those links. Otherwise, you have two scripting options to get them linked to the newly created VTCs. You can manually drag the appropriate PRT into each run-level func dicoms folder, or you can select the appropriate naming scheme from the FMR tab and have the script find them in the PRTs folder. The first option has no file naming requirements, but the second one does (See Section 2 Personal Folder Structure Notes for more information about PRT naming). Whichever option you chose, the script will take the PRTs and link them to the new VTCs.  

If you choose to have each VTC use an initial and final alignment for its own run (as opposed to aligning the data to the first run), then it will look for an IA.trf and FA.trf in each run-level folder, instead of just Run 1.  
• fMRI IDs necessary: Yes  
• Subject Table path: Experiment folder  

### SDM

RTCs are being/have been phased out by BrainVoyager. They are functionally the same as SDMs, so we'll start shifting to BrainVoyager's current state. To make SDMs, everything up to and including the VTCs must have been completed. They require the 3D motion correction design matrix (3DMC.sdm) and the VTC you wish to make them from. You have the option of making SDMs from smoothed and/or unsmoothed VTCs, depending on which folder is in the subject table.  

The first predictors will be read out from the PRT linked to the current VTC. If there happens to not be a PRT linked to the VTC, the script will look in the run-level processed data folder, where the VTC is, for a PRT to parse and link. The 6 motion parameters from the 3DMC.sdm will be set as the next 6 predictors. You have the option of adding a Constant predictor, which will get added as the final one. You have the option of reading in some of your PRT conditions as confounds. It will place these after the motion predictors. To do this, those predictors must all be at the end of your PRT (they get applied to the new SDM in the order written in the PRT). The box in the GUI says how many predictors at the end of the PRT will be included as confounds. You also have the option of skipping the first predictor from the PRT, which may be useful depending on the way you've designed your experiment. Parametric weights can also be read off the PRT and applied during the scaling of predictor values. However, I can't quite figure out how to apply different weights to different intervals of the same condition, which I know is possible in BV's regular GUI and in the PRT formatting. Weighting has yet to be tested, so if you need to use it, please let me know how it works for you and what needs to be resolved.  

I've noticed a bug when the script is parsing the MoCo SDM. BrainVoyager freezes and the last printed on the log was that it is "Parsing …3DMC.sdm," check if there is already an SDM (not including the Moco SDM) in the processed data folder for the run it got stuck on. Hopefully there is one there; delete it and restart the script. Some PRTs also give the parser a hard time; BrainVoyager will freeze and the last line printed to the log will say that it was parsing the PRT. What can happen is that the PRT text files can have the wrong combination or order of whitespace characters for new lines (/r, /n, /r/n, or /n/r). To fix this, you'll have to delete each new line character and replace it by typing Return.  
• fMRI IDs necessary: Yes  
• Subject Table path: Processed data folder  

### MDM

The way MDMs are made is different than the rest of the preprocessing steps. In the others, each actual transformation or analysis is done run by run. The MDM section, on the other hand, scrolls through the runs, building a list of VTCs or MTCs and design matrices (SDMs or RTCs, preferably the former) to write out later. You have the option of creating an MDM for each subject and one for all subjects. The former will create an MDM at the end of each subject and the latter at the end of the script. You also have the option of creating an MDM for volume space or surface space. The latter will add .ssm files from your anatomy folder into the MDM file. If you do not already have an MDM folder in your experiment folder, one will be created and the new file will be placed in there. You also have the option of using all runs, or just the even or odd ones.  
• fMRI IDs necessary: Yes if creating Surface Space MDMs, otherwise No  
• Subject Table path: Processed data folder  

### MTC

The creation of MTCs requires VTCs in the processed data folder, a Talairached VMR, and surface meshes (.srf), both in the subject's anatomy folder. The surface mesh that the script looks for is any one that has RH or LH (the two hemispheres) and has extension .srf, so make sure you have that step accomplished from the segmentation steps in BrainVoyager. If this is a problem, let me know and we can make some edits. Because the meshes are split into right and left hemisphere, the script makes two MTCs for each VTC it processes, and places them both in the same folder as the VTC from which they were created. As long as your VTC has a linked PRT, the MTC will pick it up and have it automatically linked as well. You have the option of using a template TAL brain to create the MTCs. To do so, check the appropriate box and navigate to the directory with the TAL.vmr brain. That file MUST end in \*TAL.vmr in order for the script to find it, and this is true even if you are not using a template brain. If you will be creating MDMs using the MTCs created in this step, you will need to pick a single surface mesh that you will be projecting your GLM on so that all of your MTCs have the same number of vertices, and that that number matches up with the single brain you'll be using. The script will convert ALL VTCs it finds into MTCs.  
 • fMRI IDs necessary: No  
• Subject Table path: Processed data folder  
