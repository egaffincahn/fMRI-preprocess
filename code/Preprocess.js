// fMRI data preprocessing

/*
 This script is designed to open a GUI in brain voyager and
 create several projects with one click. The .js and .ui
 files work together to interact with user input to create a
 series of settings and options for creating the fmr. The
 general course of this script is to create a java object
 that is linked to the .ui and can interact by the object's
 methods (functions defined for a specific object). Using the
 gui, the user is able to define several optional steps to
 process the raw functional data.
 
 EG Gaffin-Cahn
 
 TO DO:
 -when saving settings, alphabetize them or something!
 -create txt file to log parameters and bv log output
 -help pop-ups with right click (they're called tooltips)
 -MESH!?
 -Put in more checks for null files
 -Should it copy the tal templates when making vtcs?
  
 KNOWN BUGS:
 -Not creating a _SAG.vmr file when converting to saggital orientation; it is when i do vmr.saveas, but now it crashes at the end of IIHC;
 New vmr projects are automatically created in sag space as opposed to the manual gui when they don't? The .vmr scripts suckk....
 -Not reading Dicoms as dicoms when making .vmr - wtf?
 -When loading preprocess parameters text file and you want pre-loaded SRFs templates for making MTCs, it still asks you for new ones
 
 HINTS:
 -eval totally works
 -conditional lines using ?
 -JSON.stringify(obj,null,int) returns list of object properties
 -QObject.children() returns list of QObject children; likewise QObject.parent() returns its parent
 -QObject.objectName
 -use +=
 -label a FOR loop on the previous line with <var:> then can call <break var;> to break out of all loops up to and including the labeled one
 
 */
 
var bvqx = BrainVoyagerQX; // shorten object name for ease
var debugPrint = bvqx.PrintToLog; // make a function that prints to the log that is easily discernable as lines to delete after debugging
bvqx.ShowLogTab();

// make sure current version of brainvoyager is 2.4 or later - attempting to get version on earlier versions will throw an error b/c these method calls don't exist
try {
	bvqx.PrintToLog("BrainVoyager Version " + bvqx.VersionMajor + "." + bvqx.VersionMinor);
	bvqx.PrintToLog("Most recent update 6/19/14 12:00PM");
} catch (versionError) {
	bvqx.PrintToLog("\n\n!!! Update BrainVoyager to version 2.4 (or later) - script is not compatible with earlier versions.\n\n");
	return;
}

var procObj = new Object; // create the fmr object
procObj.scriptNameForUser = "Preprocessing GUI";
procObj.dialogFileName = "Preprocess"; // gives name of .ui to link the files
procObj.dialogAccessName = "procDialog"; // object name that links to gui's widgets

// index of tabs for which project
// for 'main' object (which main tab, moving files or preprocessing them):
var moveFiles = 0;
var preprocessFiles = 1;
// for 'preprocess' object within preprocessFiles
var FMR = 0;
var VMR = 1;
var VTC = 2;
var SDM = 3;
var MDM = 4;
var MTC = 5;


/***************************************************************************/
/****************************** GUI FUNCTIONS ******************************/
/***************************************************************************/




/******************************** MOVE FILES *******************************/

// intermediate function - called when 'add another raw data path' button is clicked
procObj.rawDataPathAddAnotherClicked = function() {
	this.enterRawDataPath(null); // we have to do this b/c the QWidget.connect signals don't like arguments...
}

// enter location of raw data to move (outside of Pages)
procObj.enterRawDataPath = function(path) {
	numOptions = this.procDialog.main.widget(moveFiles).rawDataPath.count;
	if (path == null) { // called from the button press
		newLocation = bvqx.BrowseDirectory("Browse to the location of all raw data folders"); // user chooses new directory
	} else { // called when loading pages
		newLocation = path;
	}
	if (newLocation == "") { // if they didn't press cancel
		return
	}
	existingIndex = this.procDialog.main.widget(moveFiles).rawDataPath.findText(newLocation); // see if the path is already in the list
	if (existingIndex > -1) { // already exists
		this.procDialog.main.widget(moveFiles).rawDataPath.setCurrentIndex(existingIndex);
	} else { // doesn't exist yet
		this.procDialog.main.widget(moveFiles).rawDataPath.addItem(newLocation); // add their choice to the end
		this.procDialog.main.widget(moveFiles).rawDataPath.setCurrentIndex(numOptions); // and switch to their choice
	}
}

// add blank page to move files gui
procObj.addNewPage = function() {
	this.procDialog.main.widget(moveFiles).moveTable.setCurrentCell(0,0); // change the current cell to "save" what's in there currently
	this.registerMoveBoxChanges("save"); // save the pages in an array-ed object
	this.procDialog.main.widget(moveFiles).currentPage.setText(this.pages.length+1); // increase the displayed page number
	this.registerMoveBoxChanges("new"); // create the new blank page
	this.checkPageEnablement(); // enable/disable the page up/down buttons
}

// add a duplicated page to move files gui
procObj.addDuplicatePage = function() {
    // this works differently than adding a blank page by not using registerMoveBoxChanges("new"), but rather simply changing the displayed page name
	this.procDialog.main.widget(moveFiles).moveTable.setCurrentCell(0,0); // change the current cell to "save" what's in there currently
	this.registerMoveBoxChanges("save"); // save the pages in an array-ed object
    this.pages[this.pages.length] = new Object; // make a new object as the (n+1)th item in the Pages array
	this.procDialog.main.widget(moveFiles).currentPage.setText(this.pages.length); // change the displayed page number to the max
    this.registerMoveBoxChanges("save"); // save the current page again, may not be necessary, but it's a good measure
	this.checkPageEnablement(); // enable/disable the page up/down buttons
}

// move up one Page
procObj.pageUp = function() {
	this.procDialog.main.widget(moveFiles).moveTable.setCurrentCell(0,0); // change current cell to "save" what's currently in there
	this.registerMoveBoxChanges("save"); // save page in array-ed object
	this.procDialog.main.widget(moveFiles).currentPage.setText(Number(this.procDialog.main.widget(moveFiles).currentPage.text)+1); // add one to displayed number
	this.registerMoveBoxChanges("load"); // load page from new displayed page number
	this.registerMoveBoxChanges("save");
	this.registerMoveBoxChanges("load");
	this.checkPageEnablement(); // enable/disable the page up/down buttons
}

// move down one Page
procObj.pageDown = function() {
	this.procDialog.main.widget(moveFiles).moveTable.setCurrentCell(0,0);
	this.registerMoveBoxChanges("save");
	this.procDialog.main.widget(moveFiles).currentPage.setText(Number(this.procDialog.main.widget(moveFiles).currentPage.text)-1); // subtract one from displayed number
	this.registerMoveBoxChanges("load");
	this.registerMoveBoxChanges("save");
	this.registerMoveBoxChanges("load");
	this.checkPageEnablement();
}

// set page up and page down buttons based on page number
procObj.checkPageEnablement = function() {
	current = Number(this.procDialog.main.widget(moveFiles).currentPage.text); // get the current displayed page number
	max = this.pages.length; // get the number of pages
	min = 1; // minimum number of pages is 1
    this.procDialog.main.widget(moveFiles).pageUp.enabled = true; // assume page up button is enabled
    this.procDialog.main.widget(moveFiles).pageDown.enabled = true; // assume page down button is enabled
    if (current == max) { // if we are on the highest page
        this.procDialog.main.widget(moveFiles).pageUp.enabled = false; // disable the page up button
    }
    if (current == min) { // if we are on the lowest page (both can be true if number of pages = 1)
        this.procDialog.main.widget(moveFiles).pageDown.enabled = false; // disable the page down button
    }
}

// add a row to the move files gui table
procObj.addMoveRow = function() {
	this.procDialog.main.widget(moveFiles).moveTable.rowCount += 1; // add row to the table
	var lastRowIndex = this.procDialog.main.widget(moveFiles).moveTable.rowCount-1; // get index of last row in table
    for (column = 0; column < this.procDialog.main.widget(moveFiles).moveTable.columnCount; column++) { // scroll through each cell in the new row
		this.procDialog.main.widget(moveFiles).moveTable.setItem(lastRowIndex,column, new QTableWidgetItem) // make new row, last column into QItem
	}
}

// set output data path for moving files
procObj.setMoveDataPath = function() {
	newText = bvqx.BrowseDirectory("Browse to the output directory of the copied files"); // get the directory of where to put the files
	if (newText != "") { // check if they pressed cancel
		this.procDialog.main.widget(moveFiles).moveDataPath.plainText = newText; // if they didn't press cancel, enter the new text in the field
	}
}

// toggle enabling of the date box for subjects with multiple scanning sessions
procObj.changeDateMRI = function() {
    // the state of the date field is determined by the checkbox
	this.procDialog.main.widget(moveFiles).dateMRI.enabled = this.procDialog.main.widget(moveFiles).dateMRICheckBox.checked;
}

// save text file of Pages
procObj.moveSavePages = function() {
    this.procDialog.main.widget(moveFiles).moveTable.setCurrentCell(0,0); // change current cell to "save" the current cell
	this.registerMoveBoxChanges("save"); // update Pages
    
	try {
        fileToWrite = this.pages[0].OutputPath+"/MoveFiles.txt"; // generate the full file name (MoveFiles.txt) with path (output path field)
        var pagesToWrite = new QFile(fileToWrite); // make qfile object from the new file
        pagesToWrite.open(new QIODevice.OpenMode(QIODevice.WriteOnly)); // open file for writing
        var pagesTextStream = new QTextStream(pagesToWrite); // create new text stream to write lines
        pagesTextStream.writeString("NrOfPages:\t" + this.pages.length); // write how many Pages are included
        pagesTextStream.writeString("\nParticipantType:\t" + this.procDialog.participantType.currentText); // sub, kid, adult
        pagesTextStream.writeString("\nRawDataFolder:\t" + this.pages[0].RawDataPath) // location of raw data on server
        for (page = 0; page < this.pages.length; page++) { // scroll through each page, write each field and its value, tab-delimited
            pagesTextStream.writeString("\n\nPage\t" + page); // move to next Page and write which one
            pagesTextStream.writeString("\nSkipPage\t" + this.pages[page].SkipPage); // skip the page?
            pagesTextStream.writeString("\nExperimentName\t" + this.pages[page].ExperimentName); // write the experiment name
            pagesTextStream.writeString("\nSubjectNumber\t" + this.pages[page].SubjectNumber); // write the subject number
            pagesTextStream.writeString("\nfMRINumber\t" + this.pages[page].fMRINumber);
            pagesTextStream.writeString("\nDateEnabled\t" + this.pages[page].DateEnabled);
            pagesTextStream.writeString("\nMRIDate\t" + this.pages[page].MRIDate);
            pagesTextStream.writeString("\nOutputPath\t" + this.pages[page].OutputPath);
            pagesTextStream.writeString("\nTable:\t" + this.pages[page].Table.length + " Rows\n"); // write how many rows in the movefiles table
            for (row = 0; row < this.pages[page].Table.length; row++) { // scroll through each row
                for (column = 0; column < this.pages[page].Table[row].length; column++) { // then scroll through each column
                    pagesTextStream.writeString(this.pages[page].Table[row][column]); // write the value from the current cell (row,column)
                    pagesTextStream.writeString((column==0)?"\t":""); // if column==0, write tab, otherwise write empty string
                }
                pagesTextStream.writeString("\n"); // move to next line
            }
        }
        pagesToWrite.close(); // close and save out file
        this.writeLog("Saved " + fileToWrite);
	} catch (moveSavePagesError) {
		this.writeLog("!!! Error caught trying to save table: " + moveSavePagesError);
	}
}

// load text file of Pages
procObj.moveLoadPages = function() {
    this.procDialog.main.widget(moveFiles).moveTable.setCurrentCell(0,0);
	this.registerMoveBoxChanges("save");
	
	startTime = Date.now();
	timeoutMessage = "Timeout. Likely the format of the file is messed up in some way. Check the following: tab spacing, correct number of rows, \n" +
													"3 parameters outside the subject tabs, and the words 'END OF PARAMETERS' at the end of the file";
	timeoutFunction = "if (Date.now() - startTime > 10000) {throw(timeoutMessage)}";  // running for 10 seconds
    
    try {
        var pagesFile = bvqx.BrowseFile("Select appropriate .txt file for the subject pages", "*.txt"); // load up subject pages file
        if (pagesFile != "") { // make sure user did not press cancel
            var pagesToRead = new QFile(pagesFile); // create qfile object to read the txt file
            pagesToRead.open(new QIODevice.OpenMode(QIODevice.ReadOnly)); // open for reading
            var pagesTextStream = new QTextStream(pagesToRead); // create new text stream to read lines
            var numPages = Number(pagesTextStream.readLine().split("\t")[1]); // the first line contains the number of subsequent pages
            var participantType = pagesTextStream.readLine().split("\t")[1]; // the second line says if it's a sub, kid, or adult
            var rawDataPath = pagesTextStream.readLine().split("\t")[1]; // the third line says location of raw data folder
            this.procDialog.main.widget(moveFiles).rawDataPath = rawDataPath;
            this.pages = new Array; // create new array Pages which will contain all the information of data to move
            for (page = 0; page < numPages; page++) { // scroll through the number of pages, as given by the text file
                this.pages[page] = new Object; // each item in the array is an object with properties of subject and file information
                this.pages[page].ParticipantType = participantType;
                this.pages[page].RawDataPath = rawDataPath;
                currentLine = pagesTextStream.readLine(); // read next line
                // Page X
                while (currentLine.search("Page") == -1) { // check if current line says the current page number in it
                    currentLine = pagesTextStream.readLine(); eval(timeoutFunction) // if it does not (output is -1), read next line
                }
                if (page != Number(currentLine.match("\\d+"))) { // make sure the page the text file says we should be on matches what the code says
                    this.writeLog("Problem loading pages; incorrect page numbering");
                    return; // kill it if it's not true
                }
                // Skip the Page?
                while (currentLine.search("SkipPage") == -1) { // check if we're skipping this page
                	currentLine = pagesTextStream.readLine(); eval(timeoutFunction)
                }

                this.pages[page].SkipPage = (currentLine.split("\t")[1] == "true") ? true:false;
                // ExperimentName X
                while (currentLine.search("ExperimentName") == -1) { // check if current line says experiment name in it
                    currentLine = pagesTextStream.readLine(); eval(timeoutFunction) // if it does not (output is -1), read next line
                }
                this.pages[page].ExperimentName = currentLine.split("\t")[1]; // split the line by tab, the 1th index is the experiment name
                // SubjectNumber X
                while (currentLine.search("SubjectNumber") == -1) { // check if current line says sub number in it
                    currentLine = pagesTextStream.readLine(); eval(timeoutFunction) // if it does not (output is -1), read next line
                }
                this.pages[page].SubjectNumber = currentLine.split("\t")[1]; // split by tab, 1th index has sub number
                // fMRINumber X
                while (currentLine.search("fMRINumber") == -1) { // check if current line says unique fMRI number in it
                    currentLine = pagesTextStream.readLine(); eval(timeoutFunction) // if it does not (output is -1), read next line
                }
                this.pages[page].fMRINumber = currentLine.split("\t")[1];
                // DateEnabled X
                while (currentLine.search("DateEnabled") == -1) { // check if current line says if the date field is enabled
                    currentLine = pagesTextStream.readLine(); eval(timeoutFunction) // if it does not (output is -1), read next line
                }
                this.pages[page].DateEnabled = (currentLine.split("\t")[1] == "true") ? true:false; // is there a better way to convert to boolean than a conditional?
                // MRIDate X
                while (currentLine.search("MRIDate") == -1) { // check if current line says the MRI session date in it
                    currentLine = pagesTextStream.readLine(); eval(timeoutFunction) // if it does not (output is -1), read next line
                }
                this.pages[page].MRIDate = currentLine.split("\t")[1];
                // OutputPath X
                while (currentLine.search("OutputPath") == -1) { // check if current line says the output path
                    currentLine = pagesTextStream.readLine(); eval(timeoutFunction) // if it does not (output is -1), read next line
                }
                this.pages[page].OutputPath = currentLine.split("\t")[1];
                // Table
                while (currentLine.search("Table") == -1) { // Find Table
                    currentLine = pagesTextStream.readLine(); eval(timeoutFunction)
                }
                numRows = currentLine.split("\t")[1].match("\\d+"); // next row contains number of rows (split the line by tab, take 1th index, find number in that section)
                this.pages[page].Table = new Array; // make new array which will contain table cell values
                for (row = 0; row < numRows; row++) { // scroll through each next line to convert to row
                    currentLine = pagesTextStream.readLine();
                    this.pages[page].Table[row] = new Array; // each row has an array (each sub-value is the column cell)
                    cells = currentLine.split("\t"); // split the line by tab to delineate cells
                    for (column = 0; column < cells.length; column++) { // scroll through each column/cell
                        this.pages[page].Table[row][column] = cells[column]; // Table array row's sub-array value is the cell value
                    }
                }
            }
            pagesToRead.close(); // close the text file
            this.procDialog.main.widget(moveFiles).currentPage.text = 1; // set the displayed page number to 1
            
            this.registerMoveBoxChanges("load"); // load up page 1
            this.registerMoveBoxChanges("save");
            this.registerMoveBoxChanges("load");
            this.checkPageEnablement(); // enable/disable page up/down buttons
        }
    } catch (moveLoadPagesError) {
		this.writeLog("!!! Error caught trying to load table: " + moveLoadPagesError);
	}
}

// Make new Page, update current, or load a new one
procObj.registerMoveBoxChanges = function(cmd) { // argument is which of the 3 functions to perform
	try {
        moveFilesTab = this.procDialog.main.widget(moveFiles); // shorten the name of the object for ease
        currentPageIndex = Number(moveFilesTab.currentPage.text) - 1; // the Page index is 1 less than the displayed (indices start with 0, but don't put Page 0)
        
        if (cmd == "new") { // make a new blank page (not a duplicate one, that is a different process) - all defaults
            this.pages[this.pages.length] = new Object; // create the new object at the end of the Pages array
            moveFilesTab.skipPage.checked = false;
            moveFilesTab.moveRawExpName.plainText = "Raw Data Experiment Name"; // set default experiment name field
            moveFilesTab.moveSubNumber.value = 1; // default subject number
            moveFilesTab.movefMRINumber.value = 100; // default fMRI sub number
            moveFilesTab.dateMRICheckBox.checked = false; // default date checkbox
            moveFilesTab.dateMRI.date = Date; // default date (will be disabled)
            moveFilesTab.moveDataPath.plainText = "This should be the folder that houses the Anatomy and Experiment folders - this should not be the Experiment folder itself"; // default is empty output data path
            for (folder = 0; folder < moveFilesTab.moveTable.rowCount; folder++) { // scroll through rows in the table (may be more than 1 if this is not the first page created)
                for (column = 0; column < moveFilesTab.moveTable.columnCount; column++) { // scroll through columns in the table
                    moveFilesTab.moveTable.setItem(folder,column,new QTableWidgetItem); // make a new qobject from the current cell
                    moveFilesTab.moveTable.item(folder,column).setText(""); // and set it to empty string
                }
            }
        } else if (cmd == "save") { // saving the current page - take the current value from each field and store it in the current Page array index's properties
        	this.pages[currentPageIndex].SkipPage = moveFilesTab.skipPage.checked;
        	this.pages[currentPageIndex].RawDataPath = moveFilesTab.rawDataPath.currentText;
            this.pages[currentPageIndex].ExperimentName = moveFilesTab.moveRawExpName.plainText;
            this.pages[currentPageIndex].SubjectNumber = moveFilesTab.moveSubNumber.value;
            this.pages[currentPageIndex].fMRINumber = moveFilesTab.movefMRINumber.value;
            this.pages[currentPageIndex].DateEnabled = moveFilesTab.dateMRICheckBox.checked;
            this.pages[currentPageIndex].MRIDate = moveFilesTab.dateMRI.date;
            this.pages[currentPageIndex].OutputPath = moveFilesTab.moveDataPath.plainText;
            this.pages[currentPageIndex].Table = new Array;
            for (folder = 0; folder < moveFilesTab.moveTable.rowCount; folder++) {
                this.pages[currentPageIndex].Table[folder] = new Array;
                for (column = 0; column < moveFilesTab.moveTable.columnCount; column++) {
                    this.pages[currentPageIndex].Table[folder][column] = moveFilesTab.moveTable.item(folder,column).text();
                }
                expCol = this.pages[currentPageIndex].Table[folder][1];
                if (folder > 0 && this.pages[currentPageIndex].Table[folder][0] != "" && (expCol == "" || expCol == null || expCol == undefined)) { // for final column, if it's blank, take the experiment name from previous row
                	this.pages[currentPageIndex].Table[folder][1] = this.pages[currentPageIndex].Table[folder-1][1];
				}
            }
        } else if (cmd == "load") { // load the current page after having changed the displayed page value - reverse of "save"
        	if (this.pages[currentPageIndex].ParticipantType == "Adult") {this.procDialog.participantType.setCurrentIndex(0);}
        	else if (this.pages[currentPageIndex].ParticipantType == "Kid") {this.procDialog.participantType.setCurrentIndex(1);}
        	else if (this.pages[currentPageIndex].ParticipantType == "Sub") {this.procDialog.participantType.setCurrentIndex(2);}
        	this.enterRawDataPath(this.pages[currentPageIndex].RawDataPath);
        	moveFilesTab.skipPage.checked = this.pages[currentPageIndex].SkipPage;
            moveFilesTab.moveRawExpName.plainText = this.pages[currentPageIndex].ExperimentName;
            moveFilesTab.moveSubNumber.value = this.pages[currentPageIndex].SubjectNumber;
            moveFilesTab.movefMRINumber.value = this.pages[currentPageIndex].fMRINumber;
            moveFilesTab.dateMRICheckBox.checked = this.pages[currentPageIndex].DateEnabled;
            moveFilesTab.dateMRI.date = this.pages[currentPageIndex].MRIDate;
            moveFilesTab.moveDataPath.plainText = this.pages[currentPageIndex].OutputPath;
            //for (folder = 0; folder < moveFilesTab.moveTable.rowCount; folder++) {
            for (folder = 0; folder < this.pages[currentPageIndex].Table.length; folder++) {
                for (column = 0; column < moveFilesTab.moveTable.columnCount; column++) {
                    if (folder >= moveFilesTab.moveTable.rowCount) { // check if the current row is greater than the number of rows in the table
                        moveFilesTab.moveTable.rowCount += 1; // add a row
                        for (column2 = 0; column2 < moveFilesTab.moveTable.columnCount; column2++) { // scroll through the columns (again)
                            moveFilesTab.moveTable.setItem(folder,column2, new QTableWidgetItem) // make new row, last column into QItem
                        }
                    }
                    moveFilesTab.moveTable.item(folder,column).setText(this.pages[currentPageIndex].Table[folder][column]); // set the table cell to the appropriate Pages array text
                }
            }
            if (folder < moveFilesTab.moveTable.rowCount) { // check if the last row we need is less than the total number of rows
                for (row = folder; row < moveFilesTab.moveTable.rowCount; row++) { // if so, scroll from the last row we need to the end of the table
                    for (column = 0; column < moveFilesTab.moveTable.columnCount; column++) { // and for each column...
                        // make it empty so that when we load a new Page with fewer relevant rows than the previous page, the later row texts aren't still there
                        moveFilesTab.moveTable.item(row,column).setText("");
                    }
                }
            }
        }
	} catch(registerMoveBoxChangesError) {
		this.writeLog("!!! Error in move box changes registration; command " + cmd)
		throw(registerMoveBoxChangesError)
	}
}


/******************************** PREPROCESS FILES GUI FUNCTIONS *******************************/

// set the tal template for any 
procObj.setTalTemplate = function() {
    newText = bvqx.BrowseFile("Browse to any Talairached .vmr","*.vmr");
    if (newText != "") {
        this.procDialog.main.widget(preprocessFiles).talTemplate.enabled = true;
        this.procDialog.main.widget(preprocessFiles).talTemplate.text = newText;
    }
}

// FMR - toggles slice time correction box in gui
procObj.changeSliceTimeCorrection = function() {
    // make the state of enablement of the STC box the same as the checkbox
    this.procDialog.main.widget(preprocessFiles).preprocess.widget(FMR).STC.enabled = this.procDialog.main.widget(preprocessFiles).preprocess.widget(FMR).doSliceTimeCorrection.checked;
}

// FMR - toggles motion correction box in gui
procObj.changeMotionCorrection = function() {
    // make the state of enablement for moco box the same as the moco checkbox
    this.procDialog.main.widget(preprocessFiles).preprocess.widget(FMR).MoCo.enabled = this.procDialog.main.widget(preprocessFiles).preprocess.widget(FMR).doMotionCorrection.checked;
}

// FMR - toggles temporal high pass filter box in gui
procObj.changeTemporalHighPassFiltering = function() {
    // make the state of enablement for the THP box the same as the THP checkbox
    this.procDialog.main.widget(preprocessFiles).preprocess.widget(FMR).THP.enabled = this.procDialog.main.widget(preprocessFiles).preprocess.widget(FMR).doTemporalHighPassFiltering.checked;
}

// FMR - toggles temporal smoothing box in gui
procObj.changeTemporalSmoothing = function() {
    // make the state of enablement for the temporal smoothing box the same as the checkbox
    this.procDialog.main.widget(preprocessFiles).preprocess.widget(FMR).TGS.enabled = this.procDialog.main.widget(preprocessFiles).preprocess.widget(FMR).doTemporalSmoothing.checked;
}

// FMR/VTC - toggles spatial smoothing box in gui
procObj.changeSpatialSmoothing = function() {
    // make the state of enablement for the FMR OR VTC spatial smoothing box the same as their respective checkboxes
    if (this.procDialog.main.widget(preprocessFiles).preprocess.currentIndex == FMR) { // check if we're running FMR projects
        this.procDialog.main.widget(preprocessFiles).preprocess.widget(FMR).fmrSGS.enabled = this.procDialog.main.widget(preprocessFiles).preprocess.widget(FMR).fmrDoSpatialSmoothing.checked;
    } else if (this.procDialog.main.widget(preprocessFiles).preprocess.currentIndex == VTC) { // or VTC creation
        this.procDialog.main.widget(preprocessFiles).preprocess.widget(VTC).vtcSGS.enabled = this.procDialog.main.widget(preprocessFiles).preprocess.widget(VTC).vtcDoSpatialSmoothing.checked;
    }
}

// VMR - toggle IsoVoxel interpolation method field
procObj.changeMakeISO = function() {
    widgetVMR = this.procDialog.main.widget(preprocessFiles).preprocess.widget(VMR); // store the VMR tab in a much shorter object name
	widgetVMR.vmrISOInterpolationMethod.enabled = widgetVMR.makeISO.checked; // set the interpolation method field to be linked to the checkbox state
	widgetVMR.vmrISOInterpolationMethodLabel.enabled = widgetVMR.makeISO.checked; // same with the label (just greys it out)
}

/*// VTC - load template brain path
procObj.changeVTCTemplateBrain = function() {
    try {
        // set same state of enablement for the template brain path field as the checkbox's state
        this.procDialog.main.widget(preprocessFiles).preprocess.widget(VTC).vtcTemplateBrainPath.enabled = this.procDialog.main.widget(preprocessFiles).preprocess.widget(VTC).vtcTemplateBrainBool.checked;
        if (this.procDialog.main.widget(preprocessFiles).preprocess.widget(VTC).vtcTemplateBrainPath.enabled) { // check if it's enabled
            newText = bvqx.BrowseFile("Browse to Talairached .vmr to use as a template","*TAL.vmr"); // get the brain - must end in "tal.vmr"
            if (newText != "") { // check if they didn't press cancel
                this.procDialog.main.widget(preprocessFiles).preprocess.widget(VTC).vtcTemplateBrainPath.text = newText; // set the path to the user's file
            }
        }
    } catch (templateBrainError) {
        this.writeLog("Error in getting template brain: " + templateBrainError);
    }
}
*/

// SDM - Include constant if not modeling motion as confound
procObj.changeSDMIncludeConstant = function() {
	if (!this.procDialog.main.widget(preprocessFiles).preprocess.widget(SDM).modelMotionAsConfound.checked) { // user does not want to model motion as confound
		this.procDialog.main.widget(preprocessFiles).preprocess.widget(SDM).includeConstantCondition.checked = true; // force them to include constant
	}
	// if not modeling motion as confound, disable constant condition (which is set to true); same with reverse of this
	this.procDialog.main.widget(preprocessFiles).preprocess.widget(SDM).includeConstantCondition.enabled = this.procDialog.main.widget(preprocessFiles).preprocess.widget(SDM).modelMotionAsConfound.checked;
}

/*// MTC - load template volume space brain path
procObj.changeMTCTemplateVolumeBrain = function() {
    this.procDialog.main.widget(preprocessFiles).preprocess.widget(MTC).mtcTemplateVolumePath.enabled = this.procDialog.main.widget(preprocessFiles).preprocess.widget(MTC).mtcTemplateVolumeBool.checked;
    if (this.procDialog.main.widget(preprocessFiles).preprocess.widget(MTC).vtcTemplateBrainPath.enabled) {
        newText = bvqx.BrowseFile("Browse to Talairached .vmr to use as a template","*TAL.vmr");
        if (newText != "") {
            this.procDialog.main.widget(preprocessFiles).preprocess.widget(MTC).mtcTemplateVolumePath.text = newText;
        } else {
            this.procDialog.main.widget(preprocessFiles).preprocess.widget(MTC).mtcTemplateVolumeBool.checked = false;
            this.procDialog.main.widget(preprocessFiles).preprocess.widget(MTC).mtcTemplateVolumePath.enabled = false;
        }
    }
}
*/

// MTC - load template surface space brain path
procObj.changeMTCTemplateSurfaceBrain = function() {
    this.procDialog.main.widget(preprocessFiles).preprocess.widget(MTC).mtcTemplateSurfacePathRH.enabled = this.procDialog.main.widget(preprocessFiles).preprocess.widget(MTC).mtcTemplateSurfaceBool.checked;
    this.procDialog.main.widget(preprocessFiles).preprocess.widget(MTC).mtcTemplateSurfacePathLH.enabled = this.procDialog.main.widget(preprocessFiles).preprocess.widget(MTC).mtcTemplateSurfaceBool.checked;
    if (!this.procDialog.main.widget(preprocessFiles).preprocess.widget(MTC).mtcTemplateSurfaceBool.checked) {
    	return
    }
	RH = bvqx.BrowseFile("Browse to Right Hemisphere Surface Mesh to use as a template (*RH*.srf)","*RH*.srf");
	if (RH != "") {
		LH = bvqx.BrowseFile("Browse to Left Hemisphere - Your Right Hemisphere is <" + RH.slice(RH.lastIndexOf("/")+1) + ">","*LH*.srf");
	} else {
		LH = "";
	}
	if (RH != "" && LH != "") {
		this.procDialog.main.widget(preprocessFiles).preprocess.widget(MTC).mtcTemplateSurfacePathRH.text = RH;
		this.procDialog.main.widget(preprocessFiles).preprocess.widget(MTC).mtcTemplateSurfacePathLH.text = LH;
	} else {
		this.procDialog.main.widget(preprocessFiles).preprocess.widget(MTC).mtcTemplateSurfaceBool.checked = false;
		this.procDialog.main.widget(preprocessFiles).preprocess.widget(MTC).mtcTemplateSurfacePathRH.enabled = false;
		this.procDialog.main.widget(preprocessFiles).preprocess.widget(MTC).mtcTemplateSurfacePathLH.enabled = false;
	}
    
}

// resize the window and make other small alterations if the tab is changed - DOESN'T WORK
procObj.tabChanged = function() {
    try {
        var currentTab = this.procDialog.main.widget(preprocessFiles).preprocess.currentIndex; // which tab is currently selected
        // some tabs don't take up as much space, so we condense the window
        if (currentTab == FMR) {
            tabHeight = 381;    decisionButtonPos = 590;    dialogHeight = 631;
        } else if (currentTab == VTC || currentTab == VMR) {
            tabHeight = 151;    decisionButtonPos = 360;    dialogHeight = 402;
        } else if (currentTab == SDM || currentTab == MDM || currentTab == MTC) {
            tabHeight = 91;     decisionButtonPos = 300;    dialogHeight = 343;
        }
        this.procDialog.main.widget(preprocessFiles).preprocess.widget(currentTab).geometry.setHeight(tabHeight); // size of tab window
        this.procDialog.decisionButton.geometry.setY(decisionButtonPos); // location of the decision button (OK|Cancel)
        this.procDialog.geometry.setHeight(dialogHeight); // size of entire GUI dialog box
        
    } catch (resizeError) {
        this.writeLog("!!! Error trying to resize window");
        throw(resizeError);
    }
}

// add a row to the subject numbers and experiment folder table
procObj.preprocessAddRow = function() {
    this.procDialog.main.widget(preprocessFiles).subjectTable.rowCount += 1; // add a row
    var lastRowIndex = this.procDialog.main.widget(preprocessFiles).subjectTable.rowCount-1; // get index of last row in table
    var lastColIndex = this.procDialog.main.widget(preprocessFiles).subjectTable.columnCount-1; // get index of last column in table (should be 2)
    this.procDialog.main.widget(preprocessFiles).subjectTable.setItem(lastRowIndex,lastColIndex, new QTableWidgetItem) // make new row, last column into QItem
}

// save text file of preprocess files table
procObj.saveSettings = function(varargin) {
    // brainvoyagerqx method to prompt user for input?
    // save the table itself
    try {
    	tableObj = this.procDialog.main.widget(preprocessFiles).subjectTable;
    	if (varargin == 0) {
    		fileToWrite = tableObj.item(0,2).text()+"/Preprocess_Settings.txt"; // path of new file is the path column of the first row, filename "Preprocess_Settings.txt"
//         fileToWrite = preprocessObj.subjectTable.item(0,2).text()+"/SubjectTable"+Date+".txt"; // path of new file is the path column of the first row, filename "SubjectTable.txt"
        	var tableToWrite = new QFile(fileToWrite); // make new qfile object from file
        	tableToWrite.open(new QIODevice.OpenMode(QIODevice.WriteOnly)); // open file for writing
        	var preprocessTextStream = new QTextStream(tableToWrite); // create new text stream to write lines
        } else {
			var preprocessTextStream = varargin;
		}
        preprocessTextStream.writeString("NrOfRows: " + tableObj.rowCount); // first line is the number of rows in subject table
        for (row = 0; row < tableObj.rowCount; row++) { // scroll through each of those rows
            preprocessTextStream.writeString("\n"); // move to next line
            for (column = 0; column < tableObj.columnCount; column++) { // scroll through each of the columns
                if (tableObj.item(row,column) == null) { // if the cell hasn't been edited, it may not be an object yet
                    tableObj.setItem(row, column, new QTableWidgetItem); // make it into an an object to retrieve text (which will be empty string)
                }
                preprocessTextStream.writeString(tableObj.item(row,column).text() + "\t");
            }
        }
	} catch (saveSettingsError) {
		this.writeLog("!!! Error trying to save table information in Preprocess_Settings.txt.");
		this.writeLog("!!! Error caught: " + saveSettingsError);
		return
	}
	// save the parameters in the tabs
	try {
		tabObj = this.procDialog.main.widget(preprocessFiles).preprocess;
		// add fields outside the tabs
		preprocessTextStream.writeString("\n\n\n\nPARAMETERS (WARNING - DO NOT EDIT THE TEXT TO THE LEFT OF THE TAB BREAKS):\n\n");
		preprocessTextStream.writeString("ProjectTab (corresponds to the tab index starting with 0, as grouped below):\t" + tabObj.currentIndex + "\n");
		preprocessTextStream.writeString("TalTemplate:\t" + this.procDialog.main.widget(preprocessFiles).talTemplate.text + "\n");
		preprocessTextStream.writeString("ParticipantType:\t" + this.procDialog.participantType.currentText + "\n");
		preprocessTextStream.writeString("PRTNamingScheme:\t" + this.procDialog.prtNamingScheme.currentText + "\n");
		for (tab = 0; tab <= 5; tab++) {
			objectFields = this.getObjectFields({queue: tabObj.widget(tab).children(), fields: new Array});
			preprocessTextStream.writeString("\n");
			for (property = 0; property < objectFields.fields.length; property++) {
				preprocessTextStream.writeString(objectFields.fields[property][0] + ":\t" + objectFields.fields[property][1] + "\n");
			}
		}
	} catch (saveSettingsError) {
		this.writeLog("!!! Error trying to save tab parameters in Preprocess_Settings.txt.");
		this.writeLog("!!! Error caught: " + saveSettingsError);
	}
	
	preprocessTextStream.writeString("\n\nEND OF PARAMETERS");
	
	try {
		if (varargin == 0) {
			tableToWrite.close(); // close and save out file
        	this.writeLog("Saved " + fileToWrite);
        }
    } catch (saveSettingsError) {
    	this.writeLog("!!! Error trying to save Preprocess_Settings.txt. Possibly could not find folder " + fileToWrite.slice(0,fileToWrite.lastIndexOf("/")));
		this.writeLog("!!! Error caught: " + saveSettingsError);
    }
}

procObj.loadSettingsFromDefaults = function() {
	this.loadSettings("default");
}
procObj.loadSettingsFromNavigator = function() {
	this.loadSettings("navigator");
}

// load text file of preprocess files table
procObj.loadSettings = function(settingsLocation) {
	// load up the table
	try {
		if (settingsLocation == "navigator") {
			var tableFile = bvqx.BrowseFile("Select appropriate .txt file for the preprocessing settings", "*.txt"); // load up preprocessing settings file
		} else if (settingsLocation == "default") {
			findFileObj = findFile("DEFAULTS.txt",bvqx.CurrentDirectory,0);
			if (findFileObj.FileFlag) {
				var tableFile = bvqx.BrowseFile("Cannot find DEFAULTS.txt in Current Directory. Select appropriate .txt file for the preprocessing settings", "*.txt"); // load up preprocessing settings file
			} else {
				var tableFile = findFileObj.FullFileName;
			}
		} else {
			throw("Problem getting the table to load.")
		}
		if (tableFile == "") { // make sure user did not press cancel
			return
		}
		var tableToRead = new QFile(tableFile); // create qfile object to read the txt file
		tableToRead.open(new QIODevice.OpenMode(QIODevice.ReadOnly)); // open for reading
		var preprocessTextStream = new QTextStream(tableToRead); // create new text stream to read lines
		var numRows = Number(preprocessTextStream.readLine().split(" ")[1]); // the first line contains the number of subsequent lines
		this.procDialog.main.widget(preprocessFiles).subjectTable.rowCount = 0; // reset subject table
		for (line = 0; line < numRows; line++) { // scroll through each line
			this.procDialog.main.widget(preprocessFiles).subjectTable.rowCount += 1; // add another row
			var rowInfo = preprocessTextStream.readLine().split("\t"); // split the curretxtnt line by spaces into their cells
			for (column = 0; column < this.procDialog.main.widget(preprocessFiles).subjectTable.columnCount; column++) {
				this.procDialog.main.widget(preprocessFiles).subjectTable.setItem(line, column, new QTableWidgetItem); // create new QItem for the current box
				this.procDialog.main.widget(preprocessFiles).subjectTable.item(line,column).setText(rowInfo[column]); // take info from textfile and put it in current box
			}
		}
		tableToRead.close(); // close the file
	} catch (loadSettingsError) {
		this.writeLog("!!! Error trying to load table information in " + tableFile);
		this.writeLog("!!! Error caught: " + loadSettingsError);
		return
	}
	
	// now load up the parameters
	try {
		currentLine = ""; // initialize the current line to empty string
		startTime = Date.now();
		timeoutMessage = "Timeout. Likely the format of the file is messed up in some way. Check the following: tab spacing, correct number of rows, \n" +
														"3 parameters outside the subject tabs, and the words 'END OF PARAMETERS' at the end of the file";
		timeoutFunction = "if (Date.now() - startTime > 10000) {throw(timeoutMessage)}";  // running for 10 seconds
		
		while (currentLine.search("ProjectTab") == -1) { // look for the project tab index
			currentLine = preprocessTextStream.readLine(); // if it does not (output is -1), read next line
			eval(timeoutFunction)
		}
		this.procDialog.main.widget(preprocessFiles).preprocess.setCurrentIndex(currentLine.split("\t")[1]);
		
		while (currentLine.search("TalTemplate") == -1) { // look for the tal template
			currentLine = preprocessTextStream.readLine(); // if it does not (output is -1), read next line
			eval(timeoutFunction)
		}
		this.procDialog.main.widget(preprocessFiles).talTemplate.text = currentLine.split("\t")[1];
		
		while (currentLine.search("ParticipantType") == -1) { // look for the participant type
			currentLine = preprocessTextStream.readLine(); // if it does not (output is -1), read next line
			eval(timeoutFunction)
		}
		value = currentLine.split("\t")[1];
		valueIndex = this.procDialog.participantType.findText(value);
		if (valueIndex == -1) {
			throw("Participant type field does not contain " + value + " in the drop-down menu. Check the text file you loaded.");
		}
		this.procDialog.participantType.setCurrentIndex(valueIndex);
		
		while (currentLine.search("PRTNamingScheme") == -1) { // look for the participant type
			currentLine = preprocessTextStream.readLine(); // if it does not (output is -1), read next line
			eval(timeoutFunction)
		}
		value = currentLine.split("\t")[1];
		valueIndex = this.procDialog.prtNamingScheme.findText(value);
		if (valueIndex == -1) {
			throw("PRT Naming Scheme field does not contain " + value + " in the drop-down menu. Check the text file you loaded.");
		}
		this.procDialog.prtNamingScheme.setCurrentIndex(valueIndex);
		
		preprocessObj = "this.procDialog.main.widget(preprocessFiles).preprocess.";
		while (currentLine.search(/END OF PARAMETERS/i) == -1) {
			eval(timeoutFunction)
			currentLine = preprocessTextStream.readLine();
			if (currentLine.search("^widget") == -1) {continue;} // skip the line if it's not one of the parameters (parameters start with "widget")
			field = preprocessObj + currentLine.split(":\t")[0];
			value = currentLine.split("\t")[1];
			if (field.search(/(enabled|checked)$/) > -1) { // must be boolean
				eval(field + " = Boolean(" + value + ");")
			} else if (field.search(/value$/) > -1) { // must be number
				setValue = field.slice(0,field.lastIndexOf(".")) + ".setValue(" + value + ");";
				eval(setValue)
			} else if (field.search(/currentText$/) > -1) { // drop-down menu
				getValueIndex = "valueIndex = " + field.slice(0,field.lastIndexOf(".")) + ".findText(\"" + value + "\")";
				eval(getValueIndex);
				if (valueIndex == -1) {
					throw(field + " does not contain " + value + " in the drop-down menu. Check the text file you loaded.");
				}
				setValueIndex = field.slice(0,field.lastIndexOf(".")) + ".setCurrentIndex(" + valueIndex + ");";
				eval(setValueIndex)
			} else { // read only line text edit
				// do nothing
			}
		}

	} catch (loadSettingsError) {
		this.writeLog("!!! Error trying to load parameter information in " + tableFile);
		this.writeLog("!!! Error caught: " + loadSettingsError);
		return
	}
}

// retrieves the appropriate path folder and puts it in the subject table text box
procObj.browsePathFolder = function() {
    var row = this.procDialog.main.widget(preprocessFiles).subjectTable.currentRow(); // get the row selected
    var column = this.procDialog.main.widget(preprocessFiles).subjectTable.currentColumn(); // get the column selected
    if (column == this.procDialog.main.widget(preprocessFiles).subjectTable.columnCount-1) { // check if column selected is the final column in table
        // if user clicked on a cell in the last column, open dialog box to get the directory of the experiment folder
        currentTab = this.procDialog.main.widget(preprocessFiles).preprocess.currentIndex; // which tab is currently selected
        if (currentTab == FMR || currentTab == VTC) {
        	var textPrompt = "Browse to the experiment folder for this subject";
        } else if (currentTab == SDM || currentTab == MDM || currentTab == MTC) {
        	var textPrompt = "Browse to the processed data folder for this subject";
        } else if (currentTab == VMR) {
            var textPrompt = "Browse to the anatomy folder for all subjects";
        }
        newText = bvqx.BrowseDirectory(textPrompt); // browse to path using the appropriate prompt based on the current tab selected
        if (newText != "") { // this way, pressing cancel won't erase what was in there
			this.procDialog.main.widget(preprocessFiles).subjectTable.item(row,column).setText(newText); // put the new path in the subject table box
		}
    }
}


/***************************************************************************/
/**************************** PROJECT FUNCTIONS ****************************/
/***************************************************************************/


// runs the project when user hits OK
procObj.runProj = function() {
    try {
    	var project = this.procDialog.main.currentIndex; // get the current project (move files or preprocess)
    	var writeFileProjectNumber = (project==moveFiles) ? -1 : this.procDialog.main.widget(preprocessFiles).preprocess.currentIndex;
        if (project == moveFiles) { // if we are moving files
            this.runMoveFiles(); // call to move the files
            var folderNumCol = 0; // set the column index for the folder number of the move files table
            var folderNameCol = 1; // set the column index for the folder/experiment name of the move files table
            var subjectNumCol = 0; // set the column index for the experiment subject number of the preprocessing subject table
            var fMRINumCol = 1; // set the column index for the unique fMRI sub ID of the preprocessing subject table
            var pathCol = 2; // set the column index for the path folder column of the preprocessing subject table
            
            if (this.procDialog.main.widget(moveFiles).moveMakeFMRs.checked) { // see if user wants to make FMRs at the same time
                this.procDialog.main.currentIndex = preprocessFiles; // change the main tab to preprocessing
                this.procDialog.main.widget(preprocessFiles).preprocess.currentIndex = FMR; // set the preprocessing tab to FMR
                var subjectTableRow = 0; // initialize the row index for the subject table
                this.procDialog.main.widget(preprocessFiles).subjectTable = new QTableWidget; // make a new qtablewidget object for the subject table
                // scroll through the movefiles Pages and systematically translate them into the subject table
                for (page = 0; page < this.pages.length; page++) {
                    for (row = 0; row < this.pages[page].Table.length; row++) { // scroll through the current Page's movefiles Table
                        multipleRuns = false; // assume only 1 raw data run
                        for (row2check = 0; row2check < row; row2check++) { // scroll from the top of the table to the current row
                            // check if the current row's folder name is blank or is the same as any name above it
                            if ((this.pages[page].Table[row][folderNameCol] == this.pages[page].Table[row2check][folderNameCol]) || (this.pages[page].Table[row][folderNameCol]=="")) {
                                multipleRuns = true; // if that's the case, there are multiple runs for experiment name / subject combo
                                break; // and we don't have to keep looking
                            }
                        }
                        // check if there are multiple runs or the current files to move are anatomy files
                        if (multipleRuns || this.pages[page].Table[row][folderNameCol] == "Anatomy") {
                            continue; // if so, skip this row
                        }
                        
                        this.procDialog.main.widget(preprocessFiles).subjectTable.rowCount += 1; // add 1 to the subject table row count
                        for (column = 0; column < this.procDialog.main.widget(preprocessFiles).subjectTable.columnCount; column++) { // scroll through the columns
                            this.procDialog.main.widget(preprocessFiles).subjectTable.setItem(subjectTableRow,column,new QTableWidgetItem); // make a widget item from each cell
                        }
                        
                        // set the first two columns of the subject table from the values in the Pages array
                        this.procDialog.main.widget(preprocessFiles).subjectTable.item(subjectTableRow,subjectNumCol).setText(this.pages[page].SubjectNumber);
                        this.procDialog.main.widget(preprocessFiles).subjectTable.item(subjectTableRow,fMRINumCol).setText(this.pages[page].fMRINumber);
                        
                        var previousRows = row; // we are looking for the experiment name, so assume it's in the current row
                        while (this.pages[page].Table[previousRows][folderNameCol] == "") { // check if the folder name is blank, and if it is, keep scrolling up until we find it
                            previousRows += 1;
                        }
                        // set the path column of the subject table from the row in the move files table that has the current experiment name
                        this.procDialog.main.widget(preprocessFiles).subjectTable.item(subjectTableRow,pathCol).setText(this.pages[page].OutputPath+"/"+this.pages[page].Table[previousRows][folderNameCol]);
                        subjectTableRow += 1; // increase the index of the current row in the subject table
                        
                    }
                }
                this.runPreprocess(); // once the move files table has been converted to the preprocess subject table, run the preprocess function
            }
            if (this.procDialog.main.widget(moveFiles).moveMakeVMRs.checked) { // check if user wants to make VMRs from the move files tab
                this.procDialog.main.currentIndex = preprocessFiles;
                this.procDialog.main.widget(preprocessFiles).preprocess.currentIndex = VMR;
                subjectTableRow = 0;
                this.procDialog.main.widget(preprocessFiles).subjectTable = new QTableWidget;
                for (page = 0; page < this.pages.length; page++) {
                    for (row = 0; row < this.pages[page].Table.length; row++) {
                        if (this.pages[page].Table[row][folderNameCol] == "Anatomy") { // check if current row folder name is anatomy
                            for (column = 0; column < this.procDialog.main.widget(preprocessFiles).subjectTable.columnCount; column++) {
                                this.procDialog.main.widget(preprocessFiles).subjectTable.setItem(subjectTableRow,column,new QTableWidgetItem);
                            }
                            this.procDialog.main.widget(preprocessFiles).subjectTable.item(subjectTableRow,subjectNumCol).setText(this.pages[page].SubjectNumber);
                            this.procDialog.main.widget(preprocessFiles).subjectTable.item(subjectTableRow,fMRINumCol).setText(this.pages[page].fMRINumber);
                            this.procDialog.main.widget(preprocessFiles).subjectTable.item(subjectTableRow,pathCol).setText(this.pages[page].OutputPath+"/"+this.pages[page].Table[row][folderNameCol]);
                            break; // no need to keep looking on this page - shouldn't be more than 1 anatomy per subject
                        }
                    }
                }
                this.runPreprocess(); // easier for VMRs than FMRs because there should only be 1 anatomy folder per subject, so convert the tables then run preprocess
            }
        } else if (project == preprocessFiles) { // if not moving files, then run the preprocess function
            this.runPreprocess();
        }
	
    this.writeLog(writeFileProjectNumber);

    } catch (runProjError) {
        this.writeLog("Error in run project function: " + runProjError);
        this.writeLog(writeFileProjectNumber);
        throw(runProjError);
    }
}

procObj.cancelProj = function() {
    this.writeLog("\n***\nCancelling\n***\n");
}

/* // gets the defaults by saving the whole dialog in a temporary object
procObj.retrieveDefaults = function() {
    this.defaults = this.procDialog;
}
*/


procObj.restoreDefaults = function() {
    this.writeLog("Restoring defaults...");
    
}


/**********************************************************************************/
/****************************** MAIN PROJECT ENGINES ******************************/
/**********************************************************************************/


/****************************** MOVE FILES ******************************/

procObj.runMoveFiles = function() {
	try {
	
		startTime = Date(); // get the date
		var errArray = []; // initialize error array, just in case. this will print out all the mess-ups at the end
        // errArray will be 2D array: [ [Sub], [Run], [Experiment], [Step], [BV error] ]
	
        this.registerMoveBoxChanges("save"); // save the current page before doing anything else
        templateQDir = new QDir(bvqx.CurrentDirectory); // make a template qdir object to do things like check if files exist; use of current directory is arbitrary
        this.writeLog("\n\nPreparing to move files...");
        
        var participantType = this.procDialog.participantType.currentText; // sub, kid, adult
        var rawDataPath = this.procDialog.main.widget(moveFiles).rawDataPath.currentText; // retrieve the general location of the raw data files
        if (!templateQDir.exists(rawDataPath)) {
        	throw("Your raw data location does not exist (this is the drop-down list at the top of the GUI). If you are connecting to a server, make sure the network path is correct.");
        }
        var runsMoved = 0;
        for (page = 0; page < this.pages.length; page++) { // scroll through each Page
            
            if (this.pages[page].OutputPath == "" || this.pages[page].OutputPath == null) {
            	this.writeLog("No output path found on this page... Moving on.");
            	continue // and bypass this page
            }
            if (this.procDialog.main.widget(moveFiles).skipPage.checked) {
            	this.writeLog("Skipping Page.... Moving on.");
            	continue
			}
            if (this.pages[page].ExperimentName == "Raw Data Experiment Name" || this.pages[page].ExperimentName == "") {
            	this.writeLog("No valid experiment name found on this page... Moving on.");
            	continue
            } else if (this.pages[page].ExperimentName.search("_") > -1) {
            	errArray[errArray.length] = [subNum, rawDataFilesFolderName, experimentName, "WARNING - It is highly advised that you remove underscores from your experiment name", "None"];
            }
            
            this.registerMoveBoxChanges("save");
//             currentPageIndex = Number(moveFilesTab.currentPage.text) - 1;
            this.procDialog.main.widget(moveFiles).currentPage.text = page + 1;
            this.registerMoveBoxChanges("load");
            this.registerMoveBoxChanges("save");
            
            try {
				var subNum = this.pages[page].SubjectNumber; // get the subject number
				var rawExpFolderName = this.pages[page].ExperimentName + "_?0*" + subNum; // build the expected raw data experiment folder name using <ExpName>000<##> and NOTHING else
				findFileObj = findFile(rawExpFolderName,rawDataPath,0); // full raw data experiment folder path looks for Name in raw data path
				if (findFileObj.FileFlag) {
					throw("!!! Couldn't find raw data folder for experiment " + this.pages[page].ExperimentName + " and subject " + subNum + " in " + rawDataPath);
// 					continue // and bypass this page
				} else {
					var rawExpFolderPath = findFileObj.FullFileName;
				}
	//             if (rawExpFolderPath == null) { // check if it couldn't find the right folder
	//                 this.writeLog("!!! Couldn't find raw data folder for experiment " + this.pages[page].ExperimentName + " and subject " + subNum + " in " + rawDataPath);
	//                 continue // and bypass this page
	//             }
			
	//             if (this.pages[page].DateEnabled) { // check if the date's enabled
	//                 var MRIDate = this.pages[page].MRIDate; // if so, get the date
	//             } else {
	//                 var MRIDate = "^\\d+$"; // otherwise, any series of numbers will do
	//             }
				var MRIDate = (this.pages[page].DateEnabled) ? this.pages[page].MRIDate : "^\\d+$";
				findFileObj = findFile(MRIDate,rawExpFolderPath,0); // find the appropriate session date for this subject
				if (findFileObj.FileFlag) {
					this.writeLog("!!! Couldn't find raw data folder (the folder with the date) for experiment " + this.pages[page].ExperimentName);
					this.writeLog("and subject " + subNum + " with the correct date in " + rawDataPath);
					easyDateEntered = (this.pages[page].DateEnabled) ? " (you entered " + MRIDate + ")" : "";
					this.writeLog("If the MRI date checkbox was checked, make sure the correct data is input" + easyDateEntered);
					this.writeLog("");
					throw("!!! Couldn't find the raw data folder for the current subject and date to move onto the server"); // and bypass this page
				} else {
					var rawExpDateFolderPath  = findFileObj.FullFileName;
				}
	//             if (rawExpDateFolderPath == null) { // check if it couldn't find the right folder
	//                 this.writeLog("!!! Couldn't find raw data folder of pattern " + MRIDate + " in " + rawExpFolderPath);
	//                 continue; // and bypass this page
	//             }
				var MRIDateFormatted = rawExpDateFolderPath.slice(rawExpDateFolderPath.lastIndexOf("/")+1); // get the date, according to the folder
			
            } catch (bvError) {
				errArray[errArray.length] = [subNum, rawDataFilesFolderName, experimentName, "Getting the folder structure of the raw data files", bvError];
				this.writeLog(bvError);
				continue;
			}
            
            for (row = 0; row < this.pages[page].Table.length; row++) { // scroll through the current Page's table rows
                
                if (this.pages[page].Table[row][0] == "") { // make sure it's not a blank row with no scan run number
                    continue // bypass this row
                }
                
                // in case the experiment folder cell is blank for this row, go up until we find it, noting the number of rows we had to travel
                var previousRows = 0;
                while (this.pages[page].Table[row-previousRows][1] == "") {
                    previousRows += 1;
                }
                
                try {
					// output files folders:
					folderStructure = this.getFolderStructure(page,row-previousRows); // call to get folder structure using the current page and row with the current exp name
					var encompassingFolder = folderStructure[0]; // retrieve the encompassing folder of anatomy and experiment name
					var anatomyFolder      = folderStructure[1]; // retrieve anatomy folder (not sub-level folder; just encompassing folder + /Anatomy
					var experimentFolder   = folderStructure[2]; // retrieve the experiment-level folder
					var experimentName     = folderStructure[3]; // retrieve the experiment name itself (same as the folder's name)
					var funcDicomsFolder   = folderStructure[4]; // retrieve the dicoms folder (not sub-level; just experiment folder + /FuncDicoms
					
					if (experimentName != null && experimentName.search("_") > -1) {
						errArray[errArray.length] = [subNum, rawDataFilesFolderName, experimentName, "WARNING - It is highly advised that you remove underscores from your experiment name", "None"];
					}
				
					var easyTableNumber = this.pages[page].Table[row][0] ;
					var rawDataFilesFolderName = "^" + easyTableNumber + "\\..*"; // get the scanner run number from the first column
					findFileObj = findFile(rawDataFilesFolderName,rawExpDateFolderPath,0); // get the full path of the scan session run
					if (findFileObj.FileFlag) {
						throw("!!! Couldn't find raw data folder for experiment " + this.pages[page].ExperimentName + ",\n" +
							"subject " + subNum + " with folder prefix " + easyTableNumber + " (from the subject table) in " + findFileObj.SearchDirectory);
// 						throw(e);
					} else {
						var rawDataFilesFolderPath = findFileObj.FullFileName;
					}
// 					if (rawDataFilesFolderPath == null) {
// 						throw("!!! Couldn't find folder with template " + rawDataFilesFolderName + " in " + rawExpDateFolderPath);
// 					}
                } catch (bvError) {
					errArray[errArray.length] = [subNum, rawDataFilesFolderName, experimentName, "Getting folder structure", bvError];
					this.writeLog(bvError);
					continue;
				}
                
                if (this.pages[page].Table[row][this.pages[page].Table[row].length-1] == "Anatomy") { // check if final column of this row says Anatomy
                	try {
						// get all the names of the experiments this subject did to build the subject-level anatomy folder name:
						var subAllExpNames = new Array; // create the new array of experiment names
						for (scrollRows = 0; scrollRows < this.pages[page].Table.length; scrollRows++) { // scroll through each row (again)
							// check if the current scroll row isn't the same as the current row and it's not already in the list and it's not blank
							if (scrollRows != row && subAllExpNames.indexOf(this.pages[page].Table[scrollRows][1]) == -1 && this.pages[page].Table[scrollRows][1] != "") {
								subAllExpNames[subAllExpNames.length] = this.pages[page].Table[scrollRows][1]; // add that scroll row experiment name to the array
							}
						}
						subAllExpNames.sort(); // alphabetize all the non-Anatomy experiment names that we are moving to build the anatomy folder name
						var moveDataDicomsPath = anatomyFolder + "/" + MRIDateFormatted; // begin building output path with the date first
						for (numExps = 0; numExps < subAllExpNames.length; numExps++) { // then scroll through each experiment name in the all experiment names array
							moveDataDicomsPath = moveDataDicomsPath + "_" + subAllExpNames[numExps] + this.pages[page].SubjectNumber; // add the experiment name to the path name
						}
						moveDataDicomsPath = moveDataDicomsPath + "_" + participantType + this.pages[page].fMRINumber; // example: .../Anatomy/20130628_Eccentricity34_PolarAngle34_Resting34_Sub308/<dicoms>
						templateQDir.mkdir(moveDataDicomsPath); // make the folder to put the anatomical dicoms in
						var outputFolder = moveDataDicomsPath; // save that folder path in variable called outputPath (files moved to outputPath, regardless of anatomy or functional)
                    } catch (bvError) {
						errArray[errArray.length] = [subNum, rawDataFilesFolderName, experimentName, "Preparing to move anatomy", bvError];
						this.writeLog(bvError);
						continue;
					}
                    
                } else { // we're moving functional dicoms
                    try {
						// build the subject-level func dicoms folder name and if it doesn't exist, create it
						easySubNumber = participantType + this.pages[page].SubjectNumber;
						var findFileObj = findFile(".*"+participantType+"0*"+this.pages[page].SubjectNumber+"$",funcDicomsFolder,0); // looks for "...Sub0000##" in func dicoms folder
						if (findFileObj.FileFlag) {
							subFuncDicomsFolder = funcDicomsFolder + "/" + MRIDateFormatted + "_" + participantType + subNum; // build the folder name: YYYYMMDD_Sub#
							templateQDir.mkdir(subFuncDicomsFolder); // and create the folder
						} else {
							subFuncDicomsFolder = findFileObj.FullFileName;
						}
// 						if (subFuncDicomsFolder == null) { // if it can't find it
// 							subFuncDicomsFolder = funcDicomsFolder + "/" + MRIDateFormatted + "_" + participantType + subNum; // build the folder name: YYYYMMDD_Sub#
// 							templateQDir.mkdir(subFuncDicomsFolder); // and create the folder
// 						}
					
						// check which run we're on - start at one and move up the table, checking if we've done the same experiment yet
						var currentRunNumber = 1; // assume just 1 run
						for (rowCheckRun = 0; rowCheckRun < row; rowCheckRun++) { // scroll from the top of the table to the current row
							// if the experiment name matches a previous one (not comparing two cells; just exp name to the most recent instance of that same name)
							if (experimentName == this.pages[page].Table[rowCheckRun][1]) {
								currentRunNumber += 1; // increase run count by 1
							}
						}
					
						// build run-level func dicoms folder and if it doesn't exist, create it
						var runFuncDicomsFolder = subFuncDicomsFolder + "/Run" + currentRunNumber;
						if (!templateQDir.exists(runFuncDicomsFolder)) {
							templateQDir.mkdir(runFuncDicomsFolder);
						}
						var outputFolder = runFuncDicomsFolder; // set the run-level dicoms folder as the output path for moving files
                    } catch (bvError) {
						errArray[errArray.length] = [subNum, rawDataFilesFolderName, experimentName, "Preparing to move functional dicoms", bvError];
						this.writeLog(bvError);
						continue;
					}
                }
                
                try {
					this.writeLog("Moving files from " + rawDataFilesFolderPath + " to " + outputFolder);
					runsMoved += 1;
					var numFiles = 1; // start with just 1 file to move
					findFileObj = findFile(".*0*"+numFiles+".dcm$",rawDataFilesFolderPath,0); // get the first file to move
					if (findFileObj.FileFlag) {
						throw("!!! First .dcm not found in directory " + findFileObj.SearchDirectory);
					}
					while (!findFileObj.FileFlag) { // check if it exists (keep adding numFiles until we get to the end)
						newFileName = outputFolder + findFileObj.FullFileName.slice(findFileObj.FullFileName.lastIndexOf("/")); // make the new filename (the path is the only new part)
						currentFileQ = new QFile(findFileObj.FullFileName); // make qfile from the file to move
						currentFileQ.copy(newFileName); // copy the file to move to the new filename (path)
						numFiles += 1; // go to next file
						findFileObj = findFile(".*0*"+numFiles+".dcm$",rawDataFilesFolderPath,0); // get the new file name (new path) from the next file
					}
					findFileObj = findFile(".*0*"+(numFiles+1)+".dcm$",rawDataFilesFolderPath,0);
					if (!findFileObj.FileFlag) { // check for the next next file, just in case
						missingDICOM = "!!! DICOM missing! Where is file " + numFiles + " in " + rawDataFilesFolderPath + "?! Moved files up to but not including (obviously) the missing one.";
						this.writeLog(missingDICOM);
						errArray[errArray.length] = [subNum, rawDataFilesFolderName, experimentName, "Moving files", missingDICOM];
					}
                } catch (bvError) {
					errArray[errArray.length] = [subNum, rawDataFilesFolderName, experimentName, "Moving the files", bvError];
					this.writeLog(bvError);
					continue;
				}
                this.writeLog("Finished moving " + (numFiles-1) + " files to " + outputFolder + "\n");
            }
        }
        
        this.finishScript(errArray,startTime,runsMoved);
        
    } catch (runMoveFilesError) {
        this.writeLog("!!! Error in moving files outside one of the main steps: " + runMoveFilesError);
        throw(runMoveFilesError);
    }
}


/****************************** PREPROCESS FILES ******************************/

// MAIN PREPROCESSING ENGINGE
// This function performs all the actual processing steps with brain voyager.
// It is triggered by the OK button in the GUI.
// It has several parts - each that performs one of the processing steps (FMR project, VTC, etc.)
// It will only run the processing step that is associated with the current tab in the GUI when
// the OK button is pressed.
procObj.runPreprocess = function() {
    
    try {
        preprocessObj = this.procDialog.main.widget(preprocessFiles); // shorten name for ease
        templateQDir = new QDir(bvqx.CurrentDirectory); // template qdir object for checking if other directories exist
        var err = ""; // initialize error, just in case
        var errArray = []; // initialize error array, just in case. this will print out all the mess-ups at the end
        // errArray will be 2D array: [ [Sub], [Run], [Experiment], [Step], [BV error] ]
        
        // preparations
        startTime = Date(); // get the date
        this.writeLog("\n******\n******\nProcessing engine started at " + startTime + "\n******\n******");
        var totalRunCount = 0; // just count the total number of runs that were processed, will output at the end
        var project = preprocessObj.preprocess.currentIndex; // project index from tab in GUI (represented above by var FMR, VTC, etc)
        
        // three ways to make MDMs: at the end of each vtc creation from vtc dialog, at the end of sdm creation from sdm dialog, or by themselves
        skipSDMs = false;
        makeMDMs = (project == MDM) || (project == SDM && preprocessObj.preprocess.widget(SDM).sdmMakeMDMs.checked);
        if (makeMDMs) {
            ssmGroupList = new Array; // SSMs for group-level MDMs (in the case that we're doing surface space)
            tcGroupList = new Array; // time course files (MTCs/VTCs) for group-level MDMs
            designGroupList = new Array; // SDMs/RTCs for group-level MDMs
            subsList = new Array; // list of subjects to include in group-level MDMs
            var whichRuns = preprocessObj.preprocess.widget(MDM).whichRuns.currentIndex; // all, even, or odd runs to create MDM for
        }
        
        // read from subject table and set constants
        var rowCount = preprocessObj.subjectTable.rowCount; // counts the rows in the subject table - scrolls through the process this many times
        var expSubColumn = 0; // column index 0 is the experiment subject number
        var fmriSubColumn = 1; // column index 1 is the sub's unique fmri ID
        var folderColumn = 2; // column index 2 is path to relevant folder (experiment folder or processed data folder depending on what project you're doing)
        
        if (preprocessObj.subjectTable.item(0,folderColumn).text() == "Double-click cell to browse to folder") {
        	this.writeLog("!!! You forgot to set the path folder in your subject table! Cancelling...");
        	return;
        }
        
        for (subjectTableRow = 0; subjectTableRow < rowCount; subjectTableRow++) { // scroll through each row in table (corresponding to each subject) to preprocess
            
            var subObj = preprocessObj.subjectTable.item(subjectTableRow,expSubColumn); // retrieve subject number as object from table
            if (subObj != null && subObj.text() != "") { // check to see that it's not empty - allows for empty rows in subject table
                if (subObj.text().search("-") > -1) { // check if user put range of subs (ex: 1-15)
                    var firstSub = Number(subObj.text().slice(0,subObj.text().lastIndexOf("-"))); // get the first subject in the series (1 in example)
                    var lastSub = Number(subObj.text().slice(subObj.text().lastIndexOf("-")+1)); // get the last subject in the series (15 in example)
                } else { // user only put a single subject in the box
                    var firstSub = Number(subObj.text()); // experiment-specific subject number
                    var lastSub = Number(subObj.text()); // experiment-specific subject number (again)
                }
                for (subNum = firstSub; subNum <= lastSub; subNum++) { // scroll through the subject numbers in the current row of sub table
                    // get subject info - subNum is the experiment-specific subject number
                    var fmriNumCell = preprocessObj.subjectTable.item(subjectTableRow,fmriSubColumn); // get the object in the second column cell
                    if ((fmriNumCell != null) && (fmriNumCell != "")) { // check if it hasn't been set or is blank
                        var fmriNum = Number(fmriNumCell.text()); // if it does exist, extract the text and convert to number
                    } else {
                        var fmriNum = ""; // if so, just set to empty string
                    }
                    
                    // figure out if you are using the folder path for the current row or row above
                    rowCheck = subjectTableRow;
                    var folderCell = preprocessObj.subjectTable.item(rowCheck,folderColumn); // what's in the expfolder cell
                    while (preprocessObj.subjectTable.item(rowCheck,folderColumn) == null || preprocessObj.subjectTable.item(rowCheck,folderColumn).text() == "") {
                        rowCheck = rowCheck - 1;
                    }
                    var folderStructure = this.getFolderStructure(rowCheck,[]);
                    // get all the folder names out of the structure (for ease)
                    encompassingFolder = folderStructure[0];
                    anatomyFolder      = folderStructure[1];
                    experimentFolder   = folderStructure[2];
                    experimentName     = folderStructure[3];
                    funcDicomsFolder   = folderStructure[4];
                    prtFolder          = folderStructure[5];
                    processedFolder    = folderStructure[6];
                    
                    participantType = this.procDialog.participantType.currentText; // sub, kid, adult
                    if (anatomyFolder != null) {
//                         findFileObj = findFile(".*"+experimentName+"0*"+subNum+".*"+participantType+"0*"+fmriNum,anatomyFolder,0);
						findFileObj = findFile(".*\\w+0*"+subNum+".*"+participantType+"0*"+fmriNum,anatomyFolder,0);
                        easySubFolderAnat = "*" + subNum + "_" + participantType + fmriNum;
                        if (findFileObj.FileFlag) {
                        	if (project == VTC) {
                        		this.writeLog("Cannot find subject-level anatomy folder for use in VTC project. Will look later for tal template");
                        		subFolderAnat = this.procDialog.main.widget(preprocessFiles).talTemplate.text.slice(0,this.procDialog.main.widget(preprocessFiles).talTemplate.text.lastIndexOf("/"));
                        	} else {
                        		errArray[errArray.length] = [subNum, null, "Anatomy", "Looking for subject-level anatomy folder", "Looking for " + easySubFolderAnat + " (or something like it) in " + anatomyFolder];
                        		continue;
                        	}
                        } else {
                        	subFolderAnat = findFileObj.FullFileName;
                        }
                        subRuns = 1;
                    }
                    if (funcDicomsFolder != null) {
                    	subFolderDicomsTemplate = ".*"+participantType+"0*"+subNum+"(\\D.*)?$";
                    	easySubFolder = participantType + subNum;
                        findFileObj = findFile(subFolderDicomsTemplate,funcDicomsFolder,0); // ".*Sub0*"+subNum+"\\D?.*"
                        if (findFileObj.FileFlag) {
                        	errArray[errArray.length] = [subNum, null, experimentName, "Looking for subject-level dicoms folder", "Could not find " + easySubFolder + " (or something like it) in " + funcDicomsFolder];
                        	continue
                        } else {
                        	subFolderDicoms = findFileObj.FullFileName;
                        }
                        // determine number of runs the subject has
                        var subRuns = 0; // initialize number of runs the subject did
                        while (!findFile("Run0*"+(subRuns+1),subFolderDicoms,0).FileFlag) { // keep looking for next run
                            subRuns += 1; // if it finds another run, it adds 1 to the number of runs the sub did
                        }
                    } else if (processedFolder != null) {
                    	subFolderProcTemplate = ".*"+participantType+"0*"+subNum+"(\\D.*)?$";
                    	easySubFolderProc = participantType + subNum;
                    	findFileObj = findFile(subFolderProcTemplate,processedFolder,0);
                    	if (findFileObj.FileFlag) {
                    		errArray[errArray.length] = [subNum, null, experimentName, "Looking for subject-level processed folder", "Could not find " + easySubFolderProc + " (or something like it) in " + processedFolder];
                        	continue
                        } else {
                        	subFolderProc = findFileObj.FullFileName;
                        }
                        // determine number of runs the subject has
                    	var subRuns = 0; // initialize number of runs the subject did
                        while (!findFile("Run0*"+(subRuns+1),subFolderProc,0).FileFlag) { // keep looking for next run
                            subRuns += 1; // if it finds another run, it adds 1 to the number of runs the sub did
                        }
                    }

                    for (runi = 1; runi < (subRuns+1); runi++) { // scroll through the subject's runs
                        this.writeLog("\n***\nPreprocessing data for:");
                        this.writeLog("Experiment: " + experimentName);
                        this.writeLog("Experiment subject " + subNum + " (sub " + (subjectTableRow+1) + " of " + rowCount + " total rows in subject table)");
                        this.writeLog("Subject index " + (subNum-firstSub+1) + " of " + (lastSub-firstSub+1) + " subjects in the current row of the subject table");
                        this.writeLog("Run " + runi + " of " + subRuns + "\n");
                        totalRunCount += 1;
                        if (funcDicomsFolder != null) {
                            findFileObj = findFile("Run"+runi+"(\\D.*)?.*",subFolderDicoms,0); // run folder path
                            if (findFileObj.FileFlag) {
                            	errArray[errArray.length] = [subNum, runi, experimentName, "Looking for run-level dicoms folder", "Could not find directory Run" + runi + " in " + subFolderDicoms];
                        		continue
                        	} else {
                        		runFolderDicoms = findFileObj.FullFileName;
                        	}
                        }
						if (this.procDialog.prtNamingScheme.currentIndex == 0) {
							prtNameTemplate = "^.*"+experimentName+"(\\D.*)?_.*"+participantType+"0*"+subNum+"(\\D.*)?_.*Run"+runi+"(\\D.*)?$";
						} else {
							prtNameTemplate = "^.*"+experimentName+"(\\D.*)?_.*"+participantType+"0*"+fmriNum+"(\\D.*)?_.*Run"+runi+"(\\D.*)?$";
						}
						
                        /****************************** FMR PROJECT ******************************/
                        
                        if (project == FMR) {
                            
                            if (funcDicomsFolder == null) {
                        		this.writeLog("Cannot find func dicoms folder. Check folder structure - see README for correct naming and hierarchy.");
                        		continue
                        	}
                            
                            this.writeLog("\n\nPreparing to create FMR project");
                            var firstFile = findFile(".*0001.dcm$",runFolderDicoms,0).FullFileName; // first dicom in run folder
                            var numFiles = 1; // initialize number of volumes in the run
                            // look for next dicoms by counting up by 1000s, then when it can't find the next one, count up by 100s, etc.
                            for (addFiles = 1000; addFiles >= 1; addFiles = addFiles/10) {
                                while (!findFile( ".*"+(numFiles+addFiles)+".dcm$", runFolderDicoms, 0).FileFlag) { // keep looking for next dicom
                                    numFiles += addFiles; // if it finds another dicom, it adds 1 to the number of dicoms in the run
                                    this.writeLog(numFiles + " DICOMS found so far");
                                }
                            }
                            if (!findFile(".*0*"+(numFiles+2)+".dcm$",runFolderDicoms,0).FileFlag) { // check for the next next file, just in case
                				missingDICOM = "!!! DICOM missing! Where is file " + (numFiles+1) + " in " + runFolderDicoms + "?! Moving to next run.";
                				this.writeLog(missingDICOM);
                				errArray[errArray.length] = [subNum, runi, experimentName, "Moving files", missingDICOM];
                				continue;
                			}
                            if (subNum < 10) {var subNumZero = "0" + subNum;}
                            else {var subNumZero = subNum;}
                            var fmrName = experimentName + subNumZero + "_Run" + runi + "_" + participantType + fmriNum + ".fmr"; // name of new fmr
                            if (runi == 1) {
                                var run1FolderDicoms = runFolderDicoms;
                            }
                            // check if it's the first run and doing motion correction and if you are using a target fmr to align to:
                            if (preprocessObj.preprocess.widget(FMR).MoCo.existsTargetFMR.checked) {
                                var targetFMR = findFile(".*firstvol.fmr$",run1FolderDicoms,0).FullFileName; // if so, get name of the fmr to align to
                            } else {
                                var targetFMR = null; // otherwise, just set it to null
                            }
                            
                            // create FMR project
                            try {
                                this.writeLog("Creating FMR project\n");
                                var fileType = preprocessObj.preprocess.widget(FMR).FMR.fileType.currentText; // dicom
                                var skipVols = preprocessObj.preprocess.widget(FMR).FMR.skipVols.value; // number of volumes to skip
                                var createAMR = preprocessObj.preprocess.widget(FMR).FMR.createAMR.checked; // create AMR in process
                                var numSlices = preprocessObj.preprocess.widget(FMR).FMR.numSlices.value; // number of slices in each dicom
                                var byteSwap = preprocessObj.preprocess.widget(FMR).FMR.byteSwap.checked; // swap bytes
                                var mosaicSizeX = preprocessObj.preprocess.widget(FMR).FMR.mosaicSizeX.value; // dimension of images in the volume
                                var mosaicSizeY = preprocessObj.preprocess.widget(FMR).FMR.mosaicSizeY.value;
                                var bytesPerPixel = preprocessObj.preprocess.widget(FMR).FMR.bytesPerPixel.value; // number of bytes in each pixel
                                var numImgPerVol = preprocessObj.preprocess.widget(FMR).FMR.numImgPerVol.value; // number of volumes in each dicom
                                var sizeX = preprocessObj.preprocess.widget(FMR).FMR.sizeX.value; // dimension of image
                                var sizeY = preprocessObj.preprocess.widget(FMR).FMR.sizeY.value;
                                var numVols = numFiles / numImgPerVol; // the number of volumes = number of files divided by number of images per volume
                                var numSlicesPerVol = numSlices * numImgPerVol; // number of slices in a volume = number of slices per dicom times number of dicoms per volume
                                // call the brain voyager object method to create the fmr project
                                if (numSlices > 1) { // mosaic FMR
                                    var fmr = bvqx.CreateProjectMosaicFMR(fileType, firstFile, numVols, skipVols, createAMR, numSlicesPerVol, // ...continued on next line...
                                                                        fmrName, byteSwap, mosaicSizeX, mosaicSizeY, bytesPerPixel, runFolderDicoms, numImgPerVol, sizeX, sizeY)
                                } else { // 1 slice per dicom
                                    var fmr = bvqx.CreateProjectFMR(fileType, firstFile, numVols, skipVols, createAMR, numSlicesPerVol, // ...continued on next line...
                                                                        fmrName, byteSwap, sizeX, sizeY, bytesPerPixel, runFolderDicoms);
                                }
                                fmr.SaveAs(fmrName); // save the project
                                var lastFileName = fmrName;
                            } catch (bvError) {
                                errArray[errArray.length] = [subNum, runi, experimentName, "FMR project", bvError];
                                this.writeLog(bvError);
                                break;
                            }
                            
                            // slice time correction
                            try {
                                if (preprocessObj.preprocess.widget(FMR).doSliceTimeCorrection.checked) { // confirm the stc box is checked off
                                    this.writeLog("\nDoing slice time correction\n");
                                    // slice order - ascending/descending; interleaved; odd-even/even-odd
                                    preprocessObj.preprocess.widget(FMR).STC.sliceOrder.modelColumn
                                    var sliceOrder = Number(preprocessObj.preprocess.widget(FMR).STC.sliceOrder.currentText.slice(0,2));
                                    var stcInterpolationMethod = preprocessObj.preprocess.widget(FMR).STC.stcInterpolationMethod.currentIndex; // sinc or trilinear
                                    fmr.CorrectSliceTiming(sliceOrder, stcInterpolationMethod); // bv function to do stc
                                    lastFileName = fmr.FileNameOfPreprocessdFMR; // get name of output; yes, the built-in field is spelled wrong, thanks for noticing
                                    fmr.Close(); // we close and re-open at each of the following step
                                }
                            } catch (bvError) {
                                errArray[errArray.length] = [subNum, runi, experimentName, "Slice time correction", bvError];
                                this.writeLog(bvError);
                                break;
                            }
                            
                            // motion correction
                            try {
                                if (preprocessObj.preprocess.widget(FMR).doMotionCorrection.checked) { // confirm the moco box is checked off
                                    this.writeLog("\nDoing motion correction\n");
                                    var targetVolNum = preprocessObj.preprocess.widget(FMR).MoCo.targetVolNum.value; // volume to align (might not be needing this)
                                    // can do sinc or trilinear for both detection and interpolation
                                    var mocoInterpolationMethod = preprocessObj.preprocess.widget(FMR).MoCo.mocoInterpolationMethod.currentIndex+1;
                                    var useFullDataset = preprocessObj.preprocess.widget(FMR).MoCo.useFullDataset.checked; // use the full data set
                                    var maxNumIterations = preprocessObj.preprocess.widget(FMR).MoCo.maxNumIterations.value; // maximum number of moco iterations
                                    var createMovies = preprocessObj.preprocess.widget(FMR).MoCo.createMovies.checked; // create moco movies
                                    var createExtendedLogFile = preprocessObj.preprocess.widget(FMR).MoCo.createExtendedLogFile.checked; // create the log file output
                                    fmr = bvqx.OpenDocument(lastFileName); // open the most recent fmr file opened
                                    if (targetFMR == null) { // check if we are aligning to target fmr
                                        fmr.CorrectMotionEx(targetVolNum, mocoInterpolationMethod, useFullDataset, maxNumIterations, // ...continued on next line...
                                                            createMovies, createExtendedLogFile); // don't aligning to target fmr (use current run)
                                    } else {
                                        fmr.CorrectMotionTargetVolumeInOtherRunEx(targetFMR, targetVolNum, mocoInterpolationMethod, // ...continued on next line...
                                                                                  useFullDataset, maxNumIterations, createMovies, createExtendedLogFile); // align to target fmr (use first run)
                                    }
                                    lastFileName = fmr.FileNameOfPreprocessdFMR;
                                    fmr.Close();
                                }
                            } catch (bvError) {
                                errArray[errArray.length] = [subNum, runi, experimentName, "Motion correction", bvError];
                                this.writeLog(bvError);
                                break;
                            }
                            
                            // temporal high pass filtering
                            try {
                                if (preprocessObj.preprocess.widget(FMR).doTemporalHighPassFiltering.checked) { // confirm if high pass filter is checked off
                                    this.writeLog("\nDoing temporal high pass filtering\n");
                                    var THPvalue = preprocessObj.preprocess.widget(FMR).THP.THPvalue.value; // value of minimum filter threshold
                                    var THPunit = preprocessObj.preprocess.widget(FMR).THP.THPunit.currentText; // unit of the value
                                    fmr = bvqx.OpenDocument(lastFileName);
                                    fmr.TemporalHighPassFilter(THPvalue, THPunit); // do the filtering
                                    lastFileName = fmr.FileNameOfPreprocessdFMR;
                                    fmr.Close();
                                }
                            } catch (bvError) {
                                errArray[errArray.length] = [subNum, runi, experimentName, "Temporal high pass filtering", bvError];
                                this.writeLog(bvError);
                                break;
                            }
                            
                            // temporal gaussian smoothing
                            try {
                                if (preprocessObj.preprocess.widget(FMR).doTemporalSmoothing.checked) { // confirm if temporal smoothing is checked off
                                    this.writeLog("\nDoing temporal gaussian smoothing\n");
                                    var TGSvalue = preprocessObj.preprocess.widget(FMR).TGS.TGSvalue.value; // value to smooth at
                                    var TGSunit = preprocessObj.preprocess.widget(FMR).TGS.TGSunit.currentText; // unit of value
                                    fmr = bvqx.OpenDocument(lastFileName);
                                    fmr.TemporalGaussianSmoothing(TGSvalue, TGSunit); // run smoothing
                                    lastFileName = fmr.FileNameOfPreprocessdFMR;
                                    fmr.Close();
                                }
                            } catch (bvError) {
                                errArray[errArray.length] = [subNum, runi, experimentName, "Temporal smoothing", bvError];
                                this.writeLog(bvError);
                                break;
                            }
                            
                            // spatial gaussian smoothing
                            try {
                                if (preprocessObj.preprocess.widget(FMR).fmrDoSpatialSmoothing.checked) { // confirm if spatial smoothing is checked off
                                    this.writeLog("\nDoing spatial gaussian smoothing\n");
                                    var SGSvalue = preprocessObj.preprocess.widget(FMR).fmrSGS.fmrSGSvalue.value; // value to smooth at
                                    var SGSunit = preprocessObj.preprocess.widget(FMR).fmrSGS.fmrSGSunit.currentText; // unit of value
                                    fmr = bvqx.OpenDocument(lastFileName);
                                    fmr.SpatialGaussianSmoothing(SGSvalue, SGSunit); // run smoothing
                                    lastFileName = fmr.FileNameOfPreprocessdFMR;
                                    fmr.Close();
                                }
                            } catch (bvError) {
                                errArray[errArray.length] = [subNum, runi, experimentName, "Spatial smoothing", bvError];
                                this.writeLog(bvError);
                                break;
                            }
                            
                            // link and copy prt
                            try {
                                findFileObj = findFile(prtNameTemplate, prtFolder, 0); // get prt filename from prt folder
                                if (findFileObj.DirectoryFlag) {
                                	errArray[errArray.length] = [subNum, runi, experimentName, "Couldn't find your PRTs folder which should be named "+findFileObj.SearchDirectory,"none"];
                                } else if (!findFileObj.FileFlag) { // check if prt filename exists
                                    this.writeLog("\nCopying PRT to func dicoms folder and linking it to FMR\n");
                                    prtOrig = findFileObj.FullFileName;
                                    prtQ = new QFile(prtOrig); // create qobject of prt file
                                    prtCopy = runFolderDicoms + prtOrig.slice(prtOrig.lastIndexOf("/")); // get fullfile name of new prt location
                                    prtQ.copy(prtCopy); // copies original to new location (run folder)
                                    fmr = bvqx.OpenDocument(lastFileName); // open the most recent fmr
                                    fmr.LinkStimulationProtocol(prtCopy); // link prt in run folder to fmr
                                    fmr.Save(); // save fmr
                                    fmr.Close();
                                } else { // didn't find prt file in the prts folder
                                    this.writeLog("\nNo PRT found for experiment " + experimentName + ", sub " + subNum + " run " + runi + " in PRTs folder.");
                                    this.writeLog("If you do have PRTs, make sure they are in the correct format. Check the README for allowed formatting.");
                                    errArray[errArray.length] = [subNum, runi, experimentName, "Couldn't find your PRT in "+findFileObj.SearchDirectory,"none"];
                                }
                            } catch (bvError) {
                                errArray[errArray.length] = [subNum, runi, experimentName, "Linking PRT", bvError];
                                this.writeLog(bvError);
                                break;
                            }
                            
                        }
                        
                        /****************************** VMR PROJECT ******************************/
                        
                        if (project == VMR) {
                            
                            this.writeLog("\n\nPreparing to create VMR");
                            
                            try {
								findFileObj = findFile(".*0001.dcm$",subFolderAnat,0); // first dicom in run folder
								if (findFileObj.FileFlag) {
									throw("Couldn't find your first dicom (*0001.dcm) in " + subFolderAnat);
								} else {
									firstFile = findFileObj.FullFileName;
								}
								var fileType = preprocessObj.preprocess.widget(VMR).vmrFileType.currentText;
								var numSlices = preprocessObj.preprocess.widget(VMR).vmrNumSlices.value;
								var isLittleEndian = preprocessObj.preprocess.widget(VMR).vmrIsLittleEndian.checked;
								var sizeX = preprocessObj.preprocess.widget(VMR).vmrSizeX.value;
								var sizeY = preprocessObj.preprocess.widget(VMR).vmrSizeY.value;
								var bytesPerPixel = preprocessObj.preprocess.widget(VMR).vmrBytesPerPixel.value;
								var newVMRName = subFolderAnat + subFolderAnat.slice(subFolderAnat.lastIndexOf("/"));
							
                                this.writeLog("Creating VMR project");
                                var vmr = bvqx.CreateProjectVMR(fileType, firstFile, numSlices, isLittleEndian, sizeX, sizeY, bytesPerPixel);
                                vmr.SaveAs(newVMRName+".vmr");
                            } catch (bvError) {
                                errArray[errArray.length] = [subNum, runi, "Anatomy", "Creating VMR", bvError];
                                this.writeLog(bvError);
                                this.writeLog("If you got a pop-up error, there may be an issue of BrainVoyager not reading the DICOMS as DICOMS. Not sure yet what is causing this; it does not appear to be a code issue.");
                                break;
                            }
                            
                            try {
                                if (preprocessObj.preprocess.widget(VMR).makeISO.checked) {
                                    this.writeLog("Transforming to Iso-Voxel");
                                    var vmrISOInterpolationMethod = preprocessObj.preprocess.widget(VMR).vmrISOInterpolationMethod.currentIndex+1;
                                    newVMRName = newVMRName + "_ISO";
                                    vmr.AutoTransformToIsoVoxel(vmrISOInterpolationMethod, (newVMRName+".vmr"));
//                                     vmr.SaveAs(newVMRName+".vmr");
                                }
                            } catch (bvError) {
                                errArray[errArray.length] = [subNum, runi, "Anatomy", "Transform to Iso-Voxel", bvError];
                                this.writeLog(bvError);
                                break;
                            }
                            
                            try {
                                if (preprocessObj.preprocess.widget(VMR).makeSAG.checked) {
                                    this.writeLog("Transforming to saggital orientation");
                                    newVMRName = newVMRName + "_SAG";
                                    vmr.AutoTransformToSAG(newVMRName+".vmr");
                                    // WHY ISN'T THIS WORKING!!!! It doesn't like just doing the vmr.AutoTransform..., it doesn't like being saved to the new name,
                                    // I find that if you run the script with a SAG file (just have to have the orientation, doesn't matter what's in the name), then it works, so I tried opening a template
                                    // brain that I know it works with, but if it happens online with the script then it still doesn't do the transformation...
// 									if (findFile(".*SAG.vmr",subFolderAnat,0).FileFlag) {
// 										vmr.Close();
// 										this.writeLog("For some reason the transformation to sagittal orientation doesn't work unless another sagittal orientation file is open. Doing that now...");
// 										if (!templateQDir.exists(this.procDialog.main.widget(preprocessFiles).talTemplate.text)) {
// 											sagTemplate = bvqx.BrowseFile("Browse to a file that you know has sagittal orientation (a Talairached one should work fine)","*.vmr");
// 										} else {
// 											sagTemplate = this.procDialog.main.widget(preprocessFiles).talTemplate.text;
// 										}
// 										bvqx.OpenDocument(sagTemplate);
// 										vmr = bvqx.OpenDocument(newVMRName.slice(0,newVMRName.length-4)+".vmr");
// 										vmr.AutoTransformToSAG(newVMRName+".vmr");
// 									}
									return;
                                }
                            } catch (bvError) {
                                errArray[errArray.length] = [subNum, runi, "Anatomy", "Transform to Saggital orientation", bvError];
                                this.writeLog(bvError);
                                break;
                            }
                            
                            try {
                                if (preprocessObj.preprocess.widget(VMR).makeIIHC.checked) {
                                    this.writeLog("Performing inhomogeneity correction");
                                    vmr.CorrectIntensityInhomogeneities();
                                    //vmr.SaveAs(newVMRName+".vmr");
                                }
                            } catch (bvError) {
                                errArray[errArray.length] = [subNum, runi, "Anatomy", "Inhomogeneity correction", bvError];
                                this.writeLog(bvError);
                                break;
                            }
                            
                            try {
                                if (preprocessObj.preprocess.widget(VMR).makeTAL.checked) {
                                    this.writeLog("Transforming to ACPC and TAL space");
                                    vmr.AutoACPCAndTALTransformation();
                                    //vmr.SaveAs(newVMRName+".vmr");
                                }
                            } catch (bvError) {
                                errArray[errArray.length] = [subNum, runi, "Anatomy", "Transforming to ACPC and TAL", bvError];
                                this.writeLog(bvError);
                                break;
                            }
                            
                            vmr.Close();
                        }
                        
                        /****************************** VTC PROJECT ******************************/
                        
                        if (project == VTC) {
                            
                            this.writeLog("\n\nPreparing to create VTC");
                            
                            var allProcDataFolders = new Array; // initialize array of processed data folder names (for smoothed and unsmoothed folders)
                            var vtcSGSvalue = preprocessObj.preprocess.widget(VTC).vtcSGS.vtcSGSvalue.value; // get smoothing FWHM
                            var vtcSGSunit = preprocessObj.preprocess.widget(VTC).vtcSGS.vtcSGSunit.currentText; // get smoothing unit (px or mm)
                            var smoothedDataFolder = experimentFolder + "/ProcessedData_Smoothed_" + vtcSGSvalue + "FWHM"; // get name of processed data folder
                            var unsmoothedDataFolder = experimentFolder + "/ProcessedData_Unsmoothed"; // get name of processed data folder for unsmoothed
                            
                            // find out if doing both smoothed and unsmoothed or just one, add each to allProcDataFolders array
                            // script scrolls through allProcDataFolders array with each folder name - 1 for smoothed, unsmoothed, both
                            if (!preprocessObj.preprocess.widget(VTC).vtcDoSpatialSmoothing.checked) {
                                allProcDataFolders[0] = unsmoothedDataFolder; // only doing unsmoothed
                            } else if (!preprocessObj.preprocess.widget(VTC).vtcNotSpatialSmoothing.checked) {
                                allProcDataFolders[0] = smoothedDataFolder; // only doing smoothed
                            } else { // if neither one is checked, script acts as if both are checked
                                allProcDataFolders = [unsmoothedDataFolder, smoothedDataFolder]; // doing both smoothed and unsmoothed
                            }
                            
                            for (cycle = 0; cycle < allProcDataFolders.length; cycle++) { // scroll through smooth/unsmoothed/both
                                
                                processedFolder = allProcDataFolders[cycle]; // this variable has already been set to null when getting folder structure; overwrite that
                                var subFolderProc = processedFolder + "/" + subFolderDicoms.slice(subFolderDicoms.lastIndexOf("/")+1); // get subject's processed folder
                                var runFolderProc = subFolderProc + "/Run" + runi; // get subject run's processed data folder
                                if (!templateQDir.exists(processedFolder)) { // does the processed data folder exist yet?
                                    templateQDir.mkdir(processedFolder); // if not, make it
                                }
                                if (!templateQDir.exists(subFolderProc)) { // does the subject data folder exist yet?
                                    templateQDir.mkdir(subFolderProc); // if not, make it
                                }
                                if (!templateQDir.exists(runFolderProc)) { // does the run folder exist yet?
                                    templateQDir.mkdir(runFolderProc); // if not, make it
                                }
                                
                                // because IA and FA files are only kept in the first run's dicoms folder, need to give the script the right place to look for them
                                // the first run's dicoms folder is the whole path, up until the final slash, plus the next 4 digits ("/Run") and the number "1" (first run)
                                if (preprocessObj.preprocess.widget(VTC).vtcAlignToFirstRun.checked) {
                                	var alignmentFolder = runFolderDicoms.slice(0,runFolderDicoms.lastIndexOf("/")+4) + 1;
                                } else {
                                	var alignmentFolder = runFolderDicoms;
                                }
                                
                                // skips copying if the files already exist in the individual sub/run folder
                                checkFiles = this.getVTCFiles(runFolderProc);
                                
                                // templates of files to be searched for (within 2D array):
								// first column is the regular expresssion - essentially, the template of the filename. the 'i' at the end ignores case
								// second column is which folder it looks in for the file (the dicoms or the anatomy)
								// third column - 0 means stop at the first file found, 1 means keep searching and return the longest filename found
								patternCol = 0;
								folderCol = 1;
								searchModeCol = 2;
								origFileTemplates = [[/.*fmr$/i,                  runFolderDicoms,      1], // 0
													 [/.*stc$/i,                  runFolderDicoms,      1], // 1
													 [/.*TAL.vmr$/i,              subFolderAnat,        1], // 2
													 [/.*IA.trf$/i,               alignmentFolder,	    0], // 3
													 [/.*FA.trf$/i,               alignmentFolder, 	    0], // 4
													 [/.*ACPC.trf$/i,             subFolderAnat,        0], // 5
													 [/.*ACPC.tal$/i,             subFolderAnat,        0], // 6
													 [/.*firstvol_as_anat.amr$/i, runFolderDicoms,      0], // 7
													 [/.*prt$/i,                  runFolderDicoms,      0], // 8
													 [/.*3DMC.sdm$/i,             runFolderDicoms,      0]  // 9
													];
                                
                                if (checkFiles[10]) {	// the last index in the checkFiles array is whether or not all files exist.
                                    copyFiles = checkFiles;
                                    this.writeLog("All files needed in ProcessedData folder. Skipping copy...");
                                } else {
                                    // files to copy to new processed data folder
                                    try {
                                        var origFiles = new Array; // initialize array that will contain full file names of files to be copied over
                                        var copyFiles = new Array; // initialize array that will contain full file names of copied files
                                        
                                        // copy the files over
                                        for (filei = 0; filei < origFileTemplates.length; filei++) { // scroll through the templates
                                            // search for the file template, return the found file name and path and put it in the array of filenames
                                            origFiles[filei] = findFile(origFileTemplates[filei][patternCol],origFileTemplates[filei][folderCol],origFileTemplates[filei][searchModeCol]).FullFileName;
                                            if (origFiles[filei] != null) { // make sure if found the file it was looking for
                                                this.writeLog("Copying " + origFiles[filei] + " to processed data folder");
                                                copyFiles[filei] = runFolderProc + origFiles[filei].slice(origFiles[filei].lastIndexOf("/")); // generate filename with new path
                                                templateQFile = new QFile(origFiles[filei]);
                                                templateQFile.copy(copyFiles[filei]); // copy the file over to the new path
                                            } else if (filei == 2) { // couldn't find tal.vmr
                                            	if (!templateQDir.exists(preprocessObj.talTemplate.text)) { // make sure the tal template exists
                                            		this.setTalTemplate(); // if not, get it
                                            	}
                                                copyFiles[filei] = preprocessObj.talTemplate.text; // get the tal template from the GUI but don't copy it
                                            } else if (filei == 8) { // looking for .prt
                                            	prt = findFile(prtNameTemplate,prtFolder,0).FullFileName; // look for prt in prts folder, since it's not in the dicoms folder
                                            	if (prt != null) { // found the right prt in the PRTs folder, will copy it over and link it
                                            		copyFiles[filei] = runFolderProc + prt.slice(prt.lastIndexOf("/")); // generate new prt filepath
                                            		templateQFile = new QFile(prt); // new qfile from original prt
                                            		templateQFile.copy(copyFiles[filei]); // copy original prt to copied prt location (from new name)
                                            	} else {
                                            		this.writeLog("Could not find appropriate PRT in FuncDicoms folder or PRTs folder");
                                            		errArray[errArray.length] = [subNum, runi, experimentName, "WARNING - NO PRT FOUND", null];
                                            	}
                                            } else if (filei != 8){ // don't throw an error when can't find prt
                                                throw("!!! File of template " + origFileTemplates[filei][patternCol] + " not found in " + origFileTemplates[filei][folderCol]);
                                            }
                                        }
                                    } catch (bvError) {
                                        errArray[errArray.length] = [subNum, runi, experimentName, "Copying files to processed folder", bvError];
                                        this.writeLog(bvError);
                                        break;
                                    }
                                }
                                
                                // indices here correspond to comments on far right of the large array above ^^
                                var newFMR     = copyFiles[0]; // gets fmr from processed data folder // TAKE OUT FIRST UNDERSCORE IF IT IS NOT FOLLOWED BY 'RUN#'
                                var newSTC     = copyFiles[1]; // stc
                                var newTALvmr  = copyFiles[2]; // tal.vmr
                                var newIA      = copyFiles[3]; // initial alignment
                                var newFA      = copyFiles[4]; // final alignment
                                var newACPCtrf = copyFiles[5]; // acpc.trf
                                var newACPCtal = copyFiles[6]; // acpc.tal
                                // no amr, prt, sdm included here because copying them is all we need to do
                                
                                // get the parameters for VTC creation from the GUI
                                var dataType = preprocessObj.preprocess.widget(VTC).vtcDataType.currentIndex + 1; // integer or float
                                var resolution = preprocessObj.preprocess.widget(VTC).resolution.currentIndex + 1; // 1x1x1, 2x2x2 or 3x3x3 resolution
                                var interpolationMethod = preprocessObj.preprocess.widget(VTC).vtcInterpolationMethod.currentIndex; // nearest neighbor, trilinear, or sinc
                                var bboxThreshold = preprocessObj.preprocess.widget(VTC).bboxThreshold.value; // intensity thresh for bounding box; not relevant for tal space
                                
                                // spatial smoothing of the fmr project
                                try {
                                    if (preprocessObj.preprocess.widget(VTC).vtcDoSpatialSmoothing.checked) { // check again for spatial smoothing
                                        this.writeLog("\nDoing spatial gaussian smoothing\n");
                                        var fmr = bvqx.OpenDocument(newFMR) // open the fmr to smooth
                                        fmr.SpatialGaussianSmoothing(vtcSGSvalue, vtcSGSunit); // do smoothing
                                        fmr.Close();
                                        // get newest ones that have been smoothed
                                        var newFMR = findFile(origFileTemplates[0][patternCol],runFolderProc,origFileTemplates[0][searchModeCol]).FullFileName; // get the new fmr's name that was auto-saved
                                        var newSTC = findFile(origFileTemplates[1][patternCol],runFolderProc,origFileTemplates[1][searchModeCol]).FullFileName; // get the new stc's name that was auto-saved
                                        this.writeLog("\nCreating VTC with smoothed FMR\n")
                                    } else {
                                        this.writeLog("\nCreating VTC without smoothing\n")
                                    }
                                } catch (bvError) {
                                    errArray[errArray.length] = [subNum, runi, experimentName, "FMR smoothing", bvError];
                                    this.writeLog(bvError);
                                    break;
                                }
                                
                                // get rid of any underscores that might be in the experiment name of the VTC (BrainVoyager doesn't like this if you're making GLMs)
                                try {
                                	var vtcName = newFMR.slice(newFMR.lastIndexOf("/")+1);
                                	if (experimentName.search("_") > -1) {
                                		underscores = experimentName.match(/_/g).length;
                                		for (remove = 0; remove < underscores; remove++) {
                                			vtcName = vtcName.replace("_","");
                                		}
                                	}
                                	if (vtcName.search("^" + experimentName.replace(/_/g,"") + "0*_" + subNum) > -1 || vtcName.search("^" + experimentName.replace(/_/g,"") + "0*_" + fmriNum) > -1) {
                                		vtcName = vtcName.replace("_","");
                                	}
                                	
                                	/*
                                	for (justInCase = 0; justInCase < 2; justInCase++) { // do it twice because there may be two locations we need to remove
                                		if ((vtcName.search("^" + experimentName + "0*_" + subNum) > -1) || (vtcName.search("^" + experimentName + "0*_" + fmriNum) > -1) || (experimentName.search("_") > -1)) {
                                			vtcName = vtcName.replace("_","");
                                		}
                                	}
                                	*/
                                	
                                } catch (bvError) {
                                    errArray[errArray.length] = [subNum, runi, experimentName, "Removing underscores", bvError];
                                    this.writeLog(bvError);
                                    break;
                                }
                                	
                               // make the VTC
								try {
                                    var vmr = bvqx.OpenDocument(newTALvmr);
                                    vmr.ExtendedTALSpaceForVTCCreation = false; // "prevent arbitrary size of tal bounding box" -BV scripting manual
                                    var brainSpace = preprocessObj.preprocess.widget(VTC).brainSpace.currentIndex; // get native, acpc, or tal space
                                    if (brainSpace == 0) { // Native space
                                        vtcName = vtcName.slice(0,-4) + "_NATIVE.vtc"; // generate name of new vtc
                                        vmr.CreateVTCInVMRSpace(newFMR, newIA, newFA, vtcName, dataType, resolution, interpolationMethod, bboxThreshold);
                                    } else if (brainSpace == 1) { // ACPC space
                                        vtcName = vtcName.slice(0,-4) + "_ACPC.vtc";
                                        vmr.CreateVTCInACPCSpace(newFMR, newIA, newFA, newACPCtrf, vtcName, dataType, resolution, interpolationMethod, bboxThreshold);
                                    } else { // TAL space
                                        vtcName = vtcName.slice(0,-4) + "_VTC.vtc";
                                        vmr.CreateVTCInTALSpace(newFMR, newIA, newFA, newACPCtrf, newACPCtal, vtcName, dataType, resolution, interpolationMethod, bboxThreshold); // create VTC
                                    }
                                    vmr.Close();
                                } catch (bvError) {
                                    errArray[errArray.length] = [subNum, runi, experimentName, "Creating VTC - IF YOU HAVE UNDERSCORES IN YOUR EXPERIMENT NAME OR FIRST PART OF YOUR FMR NAME PLEASE SEE EG!", bvError];
                                    this.writeLog(bvError);
                                    break;
                                }
                                
                            } // end for loop to do vtc creation with and without smoothing
                        } // end project IF statement (which project are you doing?)
                        
                        /****************************** MAKE SDMs ******************************/
                        
                        // two ways to make SDMs: at the end of each vtc creation from vtc dialog, or by themselves
                        if ( project == SDM || (project == VTC && preprocessObj.preprocess.widget(VTC).vtcMakeSDMs.checked) ) {
                            
                            if (project != VTC) { // if this is from the VTC creation step, then we may need to run it more than once (for each processed data folder)
                                allProcDataFolders = new Array;
                                allProcDataFolders[0] = processedFolder;
                            }
                            
                            for (cycle = 0; cycle < allProcDataFolders.length; cycle++) { // scroll through smooth/unsmoothed/both
                                processedFolder = allProcDataFolders[cycle];
                                
                                this.writeLog("\n\nPreparing to create SDM");
                                skipSDMs = false; // if there's an error, we need to break out of two for loops

                                try {
									// processed data folder is the folder path in the third column of the subject table, and is set in function getFolderStruct()
// 									findFileObj = findFile(subFolderProcTemplate, processedFolder, 0); // get subject's processed folder
// 									if (findFileObj.FileFlag) {
// 										throw("!!! Couldn't find your subject-level processed folder - " + participantType + subNum + " - (or something like it) in " + processedFolder);
// 									} else {
// 										var subFolderProc = findFileObj.FullFileName;
// 									}

									var runFolderProc = subFolderProc + "/Run" + runi; // get subject run's processed data folder
									// get the relevant files for rtc creation
									findFileObj = findFile(/.*vtc$/i, runFolderProc, 1); // get longest-named vtc it can find
									if (findFileObj.DirectoryFlag) {
										throw("!!! Couldn't find your run-level folder (" + findFileObj.SearchDirectory + ") in " + subFolderProc);
									}

								} catch (bvError) {
									errArray[errArray.length] = [subNum, runi, experimentName, "Getting processed folder structure for making SDM", bvError];
                                    this.writeLog(bvError);
                                    skipSDMs = true;
                                    break;
								}
								
								try {
									if (findFileObj.FileFlag) { // from above, looking for VTC in runFolderProc
										throw("!!! Couldn't find your VTC in " + runFolderProc);
									} else {
										vtc = findFileObj.FullFileName;
									}

									findFileObj = findFile(/.*3DMC.sdm$/i, runFolderProc, 1); // get 3D moco single design matrix
									if (findFileObj.FileFlag) {
										throw("!!! Couldn't find your 3DMC.sdm in " + runFolderProc);
									} else {
										mocoSDM = findFileObj.FullFileName;
									}

									findFileObj = findFile(/.*tal.vmr$/i, runFolderProc, 0); // get any tal vmr
									if (findFileObj.FileFlag) {
										if (!templateQDir.exists(preprocessObj.talTemplate.text)) { // make sure the tal template exists
                                        	this.setTalTemplate(); // if not, get it
                                        }
										talVMR = preprocessObj.talTemplate.text;
									} else {
										talVMR = findFileObj.FullFileName;
									}

								} catch (bvError) {
									errArray[errArray.length] = [subNum, runi, experimentName, "Getting files in the run-level processed data folder for making SDM", bvError];
                                    this.writeLog(bvError);
                                    skipSDMs = true;
                                    break;
								}
                                
                                try {
                                    vmr = bvqx.OpenDocument(talVMR); // open tal vmr in brainvoyager
                                    vmr.LinkVTC(vtc); // link the vtc to the open vmr
                                } catch (bvError) {
                                    errArray[errArray.length] = [subNum, runi, experimentName, "Opening TAL and linking VTC", bvError];
                                    this.writeLog(bvError);
                                    skipSDMs = true;
                                    break;
                                }
                                
                                // get and parse the prt
                                prtFromFolder = findFile(/.prt$/,runFolderProc,0); // get prt filename in the vtc's folder
                                if (vmr.StimulationProtocolFile != prtFromFolder.FullFileName) { // check if the prt in the folder and the one on the linked vtc are the same file (have the same path/name)
                                    if (vmr.StimulationProtocolFile == "<none>") { // no prt linked to this vtc
                                        if (prtFromFolder.FileFlag) {
                                        	errArray[errArray.length] = [subNum, runi, experimentName, "Linking PRT during SDM creation - No PRT linked to VTC", null];
                                        	this.writeLog("No PRT linked to VTC and no PRT in the processed data folder.");
                                        	this.writeLog("If this is clearly not true, there may be a problem finding the VTC. Check your folder structure and naming scheme.");
                                        	skipSDMs = true;
                                        	break;
                                        } else {
                                        	this.writeLog("\nNo PRT associated with the current VTC. Using the PRT in the processed data folder and saving the VTC");
                                        	vmr.LinkStimulationProtocol(prtFromFolder.FullFileName); // then give the folder prt to the vtc
											vmr.SaveVTC(vtc); // save it with the vtc linked and the prt accompanying it
                                        }
                                    } else {
                                    	errArray[errArray.length] = [subNum, runi, experimentName, "Warning - prt in processed folder is not the same as the one from the linked vtc; using linked prt", null];
                                    }
                                } else {
                                	// just use the linked prt
                                }
                                mocoSDMObj = this.parseMocoSDM(mocoSDM); // parse the 3DMC sdm into its 6 directions of motion predictors
                                prtObj = this.parsePRT(vmr.StimulationProtocolFile); // parse the linked prt into conditions
                                vmr.ClearDesignMatrix(); // clear the current design matrix before we start adding predictors
                                prtConfounds = preprocessObj.preprocess.widget(SDM).numberOfPRTConfounds.value;
                                if (prtConfounds > prtObj.NumConds) {
                                	bvError = "You have " + prtObj.NumConds + " conditions in your PRT, but in the GUI, you selected the first " + prtConfounds + " to be labeled as confounds. The second can't be greater than the first.";
                                	errArray[errArray.length] = [subNum, runi, experimentName, "Parsing PRT", bvError];
                                    this.writeLog(bvError);
                                    break;
                                }
                                	
                                
                                try { // try...catch for predictor manipulations
                                	// add predictors from prt (except the ones listed as confounds)
                                    for (var condi = 0; condi < prtObj.NumConds - prtConfounds; condi++) { // scroll through the conditions and add them to the design matrix
                                        if (!preprocessObj.preprocess.widget(SDM).skipFirstPredictor.checked || condi!=1) { // don't add predictor if we're skipping it AND it's the first condition
                                            this.writeLog(prtObj.Conditions[condi]);
                                            vmr.AddPredictor(prtObj.Conditions[condi]); // add predictor to the design matrix
                                            vmr.SetPredictorValuesFromCondition(prtObj.Conditions[condi], prtObj.Conditions[condi], 1.0); // set the condition times from the prt; 1.0 is maximum value for predictor
                                            vmr.ApplyHemodynamicResponseFunctionToPredictor(prtObj.Conditions[condi]); // convolve hrf with condition
//                                             vmr.ScalePredictorValues(prtObj.Conditions[condi], prtObj.CondWeights[condi][0], 1.0); // only needed if using parametric weights; middle arg is weight???
                                        }
                                    }
                                    // add motion predictors
                                    for (var predi = 0; predi < mocoSDMObj.NumPreds; predi++) { // scroll through the predictors (should be 6 motion directions)
                                        this.writeLog("Motion: " + mocoSDMObj.Predictors[predi]);
                                        vmr.AddPredictor(mocoSDMObj.Predictors[predi]); // add the predictor
                                        for (var vol = 0; vol < mocoSDMObj.NumVolumes; vol++) { // scroll through the volumes
                                            // add the predictor value at each volume for only that volume (+1 b/c converting from array w/ indices starting at 0 to array w/ indices starting at 1)
                                            vmr.SetPredictorValues(mocoSDMObj.Predictors[predi], vol+1, vol+1, mocoSDMObj.sdmData[predi][vol]);
                                        }
                                    }
                                    // add remaining predictors (won't be any unless scroll box in SDM tab is greater than 0)
                                    for (condi = prtObj.NumConds - prtConfounds; condi < prtObj.NumConds; condi++) { // scroll through the conditions and add them to the design matrix
										this.writeLog("Confound predictor: " + prtObj.Conditions[condi]);
										vmr.AddPredictor(prtObj.Conditions[condi]); // add predictor to the design matrix
										vmr.SetPredictorValuesFromCondition(prtObj.Conditions[condi], prtObj.Conditions[condi], 1.0); // set the condition times from the prt; 1.0 is maximum value for predictor
										vmr.ApplyHemodynamicResponseFunctionToPredictor(prtObj.Conditions[condi]); // convolve hrf with condition
// 										vmr.ScalePredictorValues(prtObj.Conditions[condi], prtObj.CondWeights[condi][0], 1.0); // only needed if using parametric weights; middle arg is weight???
									}
                                    vmr.SDMContainsConstantPredictor = preprocessObj.preprocess.widget(SDM).includeConstantCondition.checked; // tells sdm if it includes a constant predictor
                                    if (vmr.SDMContainsConstantPredictor) {
                                        constant = "Constant";
                                        this.writeLog(constant);
                                        vmr.AddPredictor(constant); //
                                        vmr.SetPredictorValues(constant, 0, vmr.NrOfVolumes, 1.0); // constant values: 0 means first volume; 1.0 is the value it's given at each time
                                    }
                                    if (preprocessObj.preprocess.widget(SDM).modelMotionAsConfound.checked) {
										// set the first confound predictor to the the first one in sdm after prt conditions
                                    	vmr.FirstConfoundPredictorOfSDM = prtObj.NumConds - prtConfounds - Number(preprocessObj.preprocess.widget(SDM).skipFirstPredictor.checked) + mocoSDMObj.FirstSDMConfound;
                                    } else {
										// set the first confound predictor to the constant at the end and model motion as predictors
                                    	vmr.FirstConfoundPredictorOfSDM = prtObj.NumConds - prtConfounds - Number(preprocessObj.preprocess.widget(SDM).skipFirstPredictor.checked) + mocoSDMObj.NumPreds + 1;
                                    }
                                } catch (bvError) { // try...catch for predictor manipulations
                                    errArray[errArray.length] = [subNum, runi, experimentName, "Adding predictors and convolving HRF", bvError];
                                    this.writeLog(bvError);
                                    break;
                                }
                                
                                var sdmName = runFolderProc + "/" + experimentName + subNum + "_Run" + runi + "_" + participantType + fmriNum + ".sdm"; // generate the new rtc name
                                this.writeLog("Saving " + sdmName);
                                vmr.SaveSingleStudyGLMDesignMatrix(sdmName); // save the sdm in the run-level processed data folder
                                vmr.Close();
                            }
                            if (skipSDMs) {
								if (makeMDMs) {
									this.writeLog("Because of the SDM error, we will not be making the MDMs either.");
									makeMDMs = false;
								}
                                break
                            }
                        } // end IF statement of SDMs
                        
                        /****************************** MAKE MDMS ******************************/

                        if (makeMDMs && (whichRuns == 0 || (whichRuns%2 == runi%2))&& !skipSDMs) { // only add vtc/design matrix to list if doing all runs or even/odd if it's the right run
                        
                            this.writeLog("\nPreparing to create list of VTCs and design matrices for MDM");
                            os = preprocessObj.preprocess.widget(MDM).os.currentText.slice(0,3);
                            if (preprocessObj.preprocess.widget(MDM).mdmType.currentIndex == 0) {
                                var hemi = [""]; // volume space
                            } else {
                                var hemi = ["_RH","_LH"]; // names of two hemispheres
                            }

                            try {
								// processed data folder is the folder path in the third column of the subject table, and is set in function getFolderStruct()
								easySubNumber = participantType + subNum;
								findFileObj = findFile(".*"+participantType+"0*"+subNum+"(\\D.*)?$", processedFolder, 0); // get subject's processed folder
								if (findFileObj.FileFlag) {
									throw("!!! Couldn't find " + easySubNumber + " (or something like it) in " + processedFolder);
								} else {
									subFolderProc = findFileObj.FullFileName;
								}
								
								findFileObj = findFile("Run" + runi,subFolderProc,0); // get subject run's processed data folder
								if (findFileObj.FileFlag) {
									throw("Couldn't find run-level processed folder for Run" + runi + " in " + subFolderProc);
								} else {
									var runFolderProc = findFileObj.FullFileName;
								}
								var mdmFolder = experimentFolder + "/MDM"; // name of MDM folder, whether it exists or not
								if (!templateQDir.exists(mdmFolder)) { // does the MDM folder exist yet?
									this.writeLog("Making MDM folder: " + mdmFolder);
									templateQDir.mkdir(mdmFolder); // if not, make it
								}
                            } catch (bvError) {
                                errArray[errArray.length] = [subNum, runi, experimentName, "Getting directory structure of processed data folders", bvError];
                                this.writeLog(bvError);
                                break;
                            }
                            
                            try {
                            
                                // outside the hemisphere FOR loop, make a new array for the current study (the current run)
                                if (runi == 1 || (runi == 2 && whichRuns == 2)) {
                                    subsList[subsList.length] = subNum; // add to subs list - only needed for group mdm
                                    ssmSingleSubjectList = new Array;
                                    tcSingleSubjectList = new Array; // reset the lists for the current subject if you're on the first run
                                    designSingleSubjectList = new Array;
                                }
                                
                                ssmGroupList[ssmGroupList.length] = new Array;
                                ssmSingleSubjectList[ssmSingleSubjectList.length] = new Array;
                                
                                tcGroupList[tcGroupList.length] = new Array;
                                tcSingleSubjectList[tcSingleSubjectList.length] = new Array;
                                
                                designSingleSubjectList[designSingleSubjectList.length] = new Array;
                                designGroupList[designGroupList.length] = new Array;
                                
                            } catch (bvError) {
                                errArray[errArray.length] = [subNum, runi, experimentName, "Developing blank lists of SSMs and Time Course files", bvError];
                                this.writeLog(bvError);
                                break;
                            }
                            
                            for (hemii = 0; hemii < hemi.length; hemii++) {
                                
                                try {
									// get the current time course file (and perhaps the surface to sphere map)
									if (preprocessObj.preprocess.widget(MDM).mdmType.currentIndex) { // surface space (index = 1)
										findFileObj = findFile(".*"+hemi[hemii]+".*mtc$", runFolderProc, 1);
										if (findFileObj.FileFlag) {
											throw("!!! Couldn't find your " + hemi[hemii] + " MTC in " + runFolderProc);
										} else {
											currentTCf = findFileObj.FullFileName;
										}
									
										findFileObj = findFile(".*"+hemi[hemii]+".*ssm$", subFolderAnat, 1);
										if (findFileObj.FileFlag) {
											throw("!!! Couldn't find your " + hemi[hemii] + " SSM in " + subFolderAnat);
										} else {
											currentSSM = findFileObj.FullFileName;
										}
									
									} else { // volume space (index = 0 and is default)
										var currentSSM = null;
									
										findFileObj = findFile(".*vtc", runFolderProc, 1); // retrieve vtc
										if (findFileObj.FileFlag) {
											throw("!!! Couldn't find your VTC in " + runFolderProc);
										} else {
											currentTCf = findFileObj.FullFileName;
										}
									}
                                } catch (bvError) {
                                    errArray[errArray.length] = [subNum, runi, experimentName, "Finding processed files in your processed data folder", bvError];
                                    this.writeLog(bvError);
                                    skipMDMs = true;
                                    break;
                                }
                                
                                try {
									var designType = preprocessObj.preprocess.widget(MDM).designType.currentText; // parameter - RTC or SDM
									findFileObj = findFile(".*([^3]...|.[^D]..|..[^M].|...[^C])."+designType+"$", runFolderProc, 1); // get either sdm or rtc to list, depending on GUI settings (find one with longest name that doesn't have 3DMC at end)
									if (findFileObj.FileFlag) {
										throw("!!! Couldn't find your " + designType + " in " + runFolderProc);
									} else {
										currentDesign = findFileObj.FullFileName;
									}
                                
                                    // make the arrays for both single sub and group mdms and then can figure out which to actually create later...
                                    // group mdm
                                    tcGroupList[tcGroupList.length-1][hemii] = currentTCf; // add the current vtc/mtc to the group list
                                    ssmGroupList[ssmGroupList.length-1][hemii] = currentSSM;
                                    designGroupList[designGroupList.length-1][hemii] = currentDesign; // add the current design to the group list (same design matrix for each hemisphere)
                                    // single subs mdm
                                    tcSingleSubjectList[tcSingleSubjectList.length-1][hemii] = currentTCf; // add the current time course file to the single sub list
                                    ssmSingleSubjectList[ssmSingleSubjectList.length-1][hemii] = currentSSM;
                                    designSingleSubjectList[designSingleSubjectList.length-1][hemii] = currentDesign; // add the current design to the single sub list
                                    skipMDMs = false;
                                } catch (bvError) {
                                    errArray[errArray.length] = [subNum, runi, experimentName, "Adding SSMs, Time Course Files, and Design Matrices to lists for MDMs", bvError];
                                    this.writeLog(bvError);
                                    skipMDMs = true;
                                    break;
                                }
                            } // end FOR loop
                            if (skipMDMs) {
                                break;
                            }
                        } // end of IF statement of MDMs (MDMs are written at the end of all runs for a single subject and/or at the end of all subjects
                        
                        /****************************** MAKE MTCS ******************************/
                        
                        // two ways to make MTCs: at the end of each vtc creation from vtc dialog, or by themselves
                        if ( project == MTC || (project == VTC && preprocessObj.preprocess.widget(VTC).vtcMakeMTCs.checked) ) {
                            
                            if (project != VTC) { // if this is from the VTC creation step, then we may need to run it more than once (for each processed data folder)
                                allProcDataFolders = new Array;
                                allProcDataFolders[0] = processedFolder;
                            }
                            for (cycle = 0; cycle < allProcDataFolders.length; cycle++) { // scroll through smooth/unsmoothed/both
                                processedFolder = allProcDataFolders[cycle];
                                this.writeLog("\n\nPreparing to create MTCs");
                                
                                // get the parameters from the GUI
                                var samplingDepthWM = preprocessObj.preprocess.widget(MTC).samplingDepthWM.value;
                                var samplingDepthGM = preprocessObj.preprocess.widget(MTC).samplingDepthGM.value;
                                var hemi = ["RH","LH"]; // names of two hemispheres
                                
                                // open the vmr to link the vtc
                                try {
                                    findFileObj = findFile(/.*tal.vmr$/i, subFolderAnat, 1); // find the talairached vmr from anatomy folder
                                    if (findFileObj.FileFlag) {
	                                    if (!templateQDir.exists(preprocessObj.talTemplate.text)) { // make sure the tal template exists
											this.setTalTemplate(); // if not, get it
										}
                                        vmr = preprocessObj.talTemplate.text; // use the tal template
                                    } else {
                                    	vmr = findFileObj.FullFileName;
                                    }
                                    vmr = bvqx.OpenDocument(vmr);
                                } catch (bvError) {
                                    errArray[errArray.length] = [subNum, runi, experimentName, "Opening TAL.vmr", bvError];
                                    this.writeLog(bvError);
                                    break;
                                }
                                
                                try {
									// processed data folder is path folder in 3rd column of subject table, instantiated in function getFolderStructure()
									findFileObj = findFile(".*Sub_?0*"+subNum+".*",processedFolder,1);
									if (findFileObj.FileFlag) {
										throw("!!! Couldn't find your subject-level processed data folder Sub" + subNum + " (or something like it)");
									} else {
										var subFolderProc = findFileObj.FullFileName;
									}
// 									var subFolderProc = processedFolder + "/" + subFolderDicoms.slice(subFolderDicoms.lastIndexOf("/")+1); // get subject's processed folder
									var runFolderProc = subFolderProc + "/Run" + runi; // get subject run's processed data folder
									findFileObj  = findFile(".*vtc$",runFolderProc,2); // find all VTCs to convert from processed data folder
									if (findFileObj.FileFlag) {
										throw("!!! Couldn't find any VTCs in " + runFolderProc);
									} else {
										vtcList = findFileObj.FullFileName;
									}
								} catch (bvError) {
                                    errArray[errArray.length] = [subNum, runi, experimentName, "Looking for VTCs", bvError];
                                    this.writeLog(bvError);
                                    break;
                                }

                                for (vtci = 0; vtci < vtcList.length; vtci++) { // scroll through each vtc found
                                	try {
                                		vtcToConvert = vtcList[vtci];
										vmr.LinkVTC(vtcToConvert); // link the VTC to the vmr
									} catch (bvError) {
										errArray[errArray.length] = [subNum, runi, experimentName, "Linking VTC named " + vtcToConvert, bvError];
										this.writeLog(bvError);
										break;
									}
									for (hemii = 0; hemii < hemi.length; hemii++) { // scroll through right and left hemispheres (RH,LH)
										try {
											if (preprocessObj.preprocess.widget(MTC).mtcTemplateSurfaceBool.checked && hemii == 0) {
												srfFile = preprocessObj.preprocess.widget(MTC).mtcTemplateSurfacePathRH.text;
											} else if (preprocessObj.preprocess.widget(MTC).mtcTemplateSurfaceBool.checked && hemii == 1) {
												srfFile = preprocessObj.preprocess.widget(MTC).mtcTemplateSurfacePathLH.text;
											} else {
												findFileObj = findFile(".*"+hemi[hemii]+".*srf$",subFolderAnat,1); // find any XH srf
												if (findFileObj.FileFlag) {
													this.writeLog("Could not find appropriate mesh (*RH_RECOSM.srf, for example) for sub " + subNum + " in " + subFolderAnat);
													errArray[errArray.length] = [subNum, runi, experimentName, "WARNING - Could not find mesh (.srf)", null];
												} else {
													srf = vmr.LoadMesh(findFileObj.FullFileName); // open RECOSM.srf into brain voyager
													mtcName = runFolderProc + vtcToConvert.slice(vtcToConvert.lastIndexOf("/"),-4) + "_" + hemi[hemii] + ".mtc"; // generate the new MTC name
													vmr.CreateMTCFromVTC(samplingDepthWM, samplingDepthGM, mtcName); // create MTC from VTC
													this.writeLog("Created " + mtcName);
												}
											}
										
	// 										if (srfFile != null) { // loaded SRF properly
	//                                             srf = vmr.LoadMesh(srfFile); // open RECOSM.srf into brain voyager
	//                                             mtcName = runFolderProc + vtcToConvert.slice(vtcToConvert.lastIndexOf("/"),-4) + "_" + hemi[hemii] + ".mtc"; // generate the new MTC name
	//                                             vmr.CreateMTCFromVTC(samplingDepthWM, samplingDepthGM, mtcName); // create MTC from VTC
	//                                             this.writeLog("Created " + mtcName);
	//                                             
	//                                         } else {
	//                                             this.writeLog("Could not find appropriate mesh (RECOSM.srf) for sub " + subNum);
	//                                             errArray[errArray.length] = [subNum, runi, experimentName, "WARNING - Could not find mesh (RECOSM.srf)", null];
	//                                         }
										} catch (bvError) {
											errArray[errArray.length] = [subNum, runi, experimentName, "Opening mesh/Creating MTC", bvError];
											this.writeLog(bvError);
											break;
										}
									}
                                }
                                vmr.Close(); // close the vmr
                            }
                            
                        } // end MTC project IF statement
                        
                        /****************************** CLOSING MAIN PROCESSING ENGINE ******************************/
                        
                        this.writeLog("\nFinished run " + runi);
                    } // end run loop
                    
                    if (makeMDMs && preprocessObj.preprocess.widget(MDM).singleSubject.checked && !skipSDMs) { // write the mdm for single subs iff making mdms and we want to make individual sub files
                        mdmName = mdmFolder + "/" + experimentName + "_" + participantType + subNum + "_" + preprocessObj.preprocess.widget(MDM).whichRuns.currentText.replace(" ","") + "_" + os;
                        mdmError = this.writeMDM(0, ssmSingleSubjectList, tcSingleSubjectList, designSingleSubjectList, mdmName, hemi); // write subject's mdm; returns any error
                        if (mdmError) {
                            errArray[errArray.length] = [subNum, runi, experimentName, "Writing MDM", mdmError];
                        }
                    }
                    this.writeLog("\nFinished sub " + subNum + " for experiment " + experimentName + "\n");
                } // end of loop through subject series in a single box (ex. subs 1-15)
            } else { // empty row in subject table
                this.writeLog("Empty row in subject table found");
            } // end IF-ELSE statement of empty row in subject table
        } // end subject loop
        
        if (makeMDMs && preprocessObj.preprocess.widget(MDM).group.checked && !skipSDMs) { // write the mdm for group of subjects iff making mdms and we want to make a group-level file
            function numerically(a,b) { return a < b ? -1 : a > b ? 1 : 0; } // creates a function that helps the array method 'sort' sort by number value instead of string value
            mdmName = mdmFolder + "/" + experimentName + "_" + participantType + "s" + subsList.sort(numerically).toString().replace(/,/g,"_") + "_" + preprocessObj.preprocess.widget(MDM).whichRuns.currentText.replace(" ","") + "_" + os;
            mdmError = this.writeMDM(0, ssmGroupList, tcGroupList, designGroupList, mdmName, hemi); // write group-level mdm
            if (mdmError) {
                errArray[errArray.length] = [subNum, runi, experimentName, "Writing MDM", mdmError];
            }
        }
        
        this.finishScript(errArray,startTime,totalRunCount);
        
    } catch(err) {
        this.writeLog("!!! Caught error outside of a processing step. This stops the entire process.");
        this.writeLog("!!! Error found: " + err); // catch the error and print it out in the log
    }
}

/******************************************************************************/
/****************************** HELPER FUNCTIONS ******************************/
/******************************************************************************/


// This function takes the folder name or path (depending on if you're moving or preprocessing) and
// does some figuring out of what's in the folder. It then determines where your dicoms, anatomy,
// processed data, etc. are and returns them all in a structure. It does some error checking too.
// Arguments in: If you're moving files, ARG1 is the page you're currently moving files for, and ARG2
// is the row number for the current files to move from the table. If you're preprocessing, ARG1
// is the folder path (column 3 of the table) and ARG2 is the preprocessing step project index.
procObj.getFolderStructure = function(ARG1, folderNameRow) {
	try {
        
        var folderStructure = new Array;
        var tempFolder = new QDir;
        
        project == null;
        pastVTC = false;
        encompassingFolder = null;
        anatomyFolder = null;
        experimentFolder = null;
        experimentName = null;
        funcDicomsFolder = null;
        prtFolder = null;
        processedFolder = null;
        
        if (this.procDialog.main.currentIndex == moveFiles) {
            page = ARG1;
            encompassingFolder = this.pages[page].OutputPath;
            if (!tempFolder.exists(encompassingFolder)) {
            	tempFolder.mkdir(encompassingFolder);
            }
            anatomyFolder = encompassingFolder + "/Anatomy";
            experimentName = this.pages[page].Table[folderNameRow][1];
            if (experimentName != "Anatomy") {
                experimentFolder = encompassingFolder + "/" + experimentName;
                funcDicomsFolder = experimentFolder + "/FuncDicoms";
                if (!tempFolder.exists(experimentFolder)) {
            		tempFolder.mkdir(experimentFolder);
            	}
            	if (!tempFolder.exists(funcDicomsFolder)) {
            		tempFolder.mkdir(funcDicomsFolder);
            	}
            } else if (!tempFolder.exists(anatomyFolder)) {
            	tempFolder.mkdir(anatomyFolder);
            }

        } else {
            row = ARG1;
            rowText = this.procDialog.main.widget(preprocessFiles).subjectTable.item(row,2).text().replace(/\/*$/,""); // remove slashes at the end
            if (!tempFolder.exists(rowText)) {
            	throw("!!! Your path in row index " + row + " (note row 0 = first row) of the subject table '" + rowText + "' does not exist!");
            }
            var project = this.procDialog.main.widget(preprocessFiles).preprocess.currentIndex;
            if (project == FMR || project == VTC) {
                experimentFolder = rowText;
                experimentName = experimentFolder.slice(experimentFolder.lastIndexOf("/")+1);
                encompassingFolder = experimentFolder.slice(0,experimentFolder.lastIndexOf("/"));
                if (project == VTC) {
                    anatomyFolder = encompassingFolder + "/Anatomy";
                }
                prtFolder = experimentFolder + "/" + experimentName + "_PRTs";
                funcDicomsFolder = experimentFolder + "/FuncDicoms";
            } else if (project == VMR) {
// 				experimentFolder = rowText;
//              experimentName = experimentFolder.slice(experimentFolder.lastIndexOf("/")+1); // not really, but just for user ease
				experimentName = "";
                anatomyFolder = rowText;
                encompassingFolder = anatomyFolder.slice(0,anatomyFolder.lastIndexOf("/"));
            } else if (project == SDM || project == MDM || project == MTC) {
            	pastVTC = true;
                processedFolder = rowText;
                experimentFolder = processedFolder.slice(0,processedFolder.lastIndexOf("/"));
                experimentName = experimentFolder.slice(experimentFolder.lastIndexOf("/")+1);
                encompassingFolder = experimentFolder.slice(0,experimentFolder.lastIndexOf("/"));
                if ((project == MTC) || ((project == SDM || project == MDM) && this.procDialog.main.widget(preprocessFiles).preprocess.widget(MDM).mdmType.currentIndex==1)) {
                	anatomyFolder = encompassingFolder + "/Anatomy";
                }
//                 funcDicomsFolder = experimentFolder + "/FuncDicoms";
            }
        }
        folderStructure[0] = encompassingFolder;
        folderStructure[1] = anatomyFolder;
        folderStructure[2] = experimentFolder;
        folderStructure[3] = experimentName;
        folderStructure[4] = funcDicomsFolder;
        folderStructure[5] = prtFolder;
        folderStructure[6] = processedFolder;
        
        // check if experimentName has any of the usual suspects for incorrect path in subject folder or move page
        stop = false
        stopMSG1 = "Based on your folder structure and path information,\nyour ";
        stopMSG2 = ".\nIs this correct? Press OK to continue, or X out of this box to stop. Script will continue if the timer runs down.";
        if (project == VMR && anatomyFolder.search(/Anatomy$/) == -1) {
        	stop = !bvqx.TimeOutMessageBox(stopMSG1 + "anatomical folder is " + experimentFolder + stopMSG2, 60);
        } else if ((experimentName.search(/(Anatomy|Dicom|PRT)/i) > -1 && (project != null)) || (experimentName.search(/Processed/i) > -1 && ~pastVTC)) {
        	stop = !bvqx.TimeOutMessageBox(stopMSG1 + "experiment folder is " + experimentFolder + stopMSG2, 60);
        } else if (processedFolder != null && processedFolder.search(/Processed/i) == -1)  {
        	stop = !bvqx.TimeOutMessageBox(stopMSG1 + "processed data folder is " + processedFolder + stopMSG2, 60);
        }
        if (stop) {
			throw("There was probably an issue with the the path you gave in the subject table.\n"+
				"Consult the README for the correct folder to enter into the subject table for a given preprocess project.")
		}
		
        /*
        for (folder = 0; folder < folderStructure.length; folder++) {
            if (folderStructure[folder] != null && folder != 3) {
                this.writeLog("Checking existence of folder " + folderStructure[folder]);
                if (!tempFolder.exists(folderStructure[folder])) {
                    this.writeLog("Folder not found. Creating directory " + folderStructure[folder]);
                    tempFolder.mkdir(folderStructure[folder]);
                }
            }
        }
        */
        
        return folderStructure;
        
    } catch (getFolderStructureError) {
    	this.writeLog("!!! Error in getFolderStructure: " + getFolderStructureError);
    	throw(getFolderStructureError);
    }
}

// This function takes an object's children and recursively searches all children's children
// to get all the relevant sub-fields in the GUI and their values. It returns an object that
// has each field name as a property and each field value as the value of that property.
procObj.getObjectFields = function(objectFields) {
	try {
		importantProps = [/"checked"/,/"currentText"/,/"value"/,/"text"/];
		while (objectFields.queue.length > 0) {
			widget = objectFields.queue.shift(); // removes index [0] from array and returns it
			fieldName = widget.objectName; // get the widget's field name
			// skip if any of the of the following are true
			if (!(fieldName.search(/label/i) > -1 || fieldName.search("^qt") > -1 || widget.toString() == "QLabel" || fieldName == "" || fieldName == null || fieldName == undefined)) {
				properties = JSON.stringify(widget,null); // get all the field's built-in properties
				found = false;
				if (widget.toString() == "QGroupBox" && properties.search("enabled") > -1) { // include the group boxes that can be enabled/disabled (that don't have explicit entry values)
					fullFieldName = "this.procDialog.main" + this.getObjectAncestors(widget,"main") + ".enabled"; // build the widget's full object ancestry tree
					fieldValue = eval(fullFieldName);
					found = true;
				} else {
					for (checkProp = 0; checkProp < importantProps.length; checkProp++) {
						if (properties.search(importantProps[checkProp]) > -1) {
							propName = String(importantProps[checkProp]).replace(/\//g,"").replace(/"/g,"");
							fullFieldName = "this.procDialog.main" + this.getObjectAncestors(widget,"main") + "." + propName; // build the widget's full object ancestry tree
							fieldValue = eval(fullFieldName);
							found = true;
							break
						}
					}
				}
				if (found) {
					objectFields.fields[objectFields.fields.length] = new Array;
					objectFields.fields[objectFields.fields.length-1] = [fullFieldName.slice(fullFieldName.lastIndexOf("widget")), fieldValue];
				}
			}
			
			children = widget.children();
			if (children.length > 0) {
				f = new Array; for (i = 0; i < children.length; i++) {f[i] = children.objectName;}
				objectFields.queue = children.concat(objectFields.queue); // add queue[0].children() to front of queue
				objectFields = this.getObjectFields(objectFields);
			}
		}
		return objectFields;
	} catch (getObjectFieldsError) {
		this.writeLog("!!! Error trying to get the object fields for saving parameters: " + getObjectFieldsError);
    }
}

// This function takes a widget and iteratively scrolls up in lineage until it finds the
// finalFieldName and returns the entire string of sub-widgets
procObj.getObjectAncestors = function(widget,finalFieldName) {
	try {
		ancestors = "";
		while (widget.objectName != finalFieldName) {
			// build the ancestor list
			if (widget.toString() == "QWidget" && widget.objectName.search(/tab/i) > -1) { // this is a special case where the the object names field != the object name to call it
				ancestors = "(" + widget.objectName.slice(3,6) + ")" + ancestors; // converts e.g. "tabFMR" (object name) to just "FMR" (tab text which works as object reference)
			} else if (widget.toString() == "QWidget") {
				ancestors = "(" + widget.objectName + ")" + ancestors; // use full name 
			} else if (widget.toString() == "QStackedWidget") {
				ancestors = ".widget" + ancestors;
			} else {
				ancestors = "." + widget.objectName + ancestors;
			}
			widget = widget.parent(); // move up one in the ancestral tree
		}
		return ancestors
	} catch (getObjectAncestorsError) {
		this.writeLog("!!! Error trying to get the object's ancestors during saving of parameters: " + getObjectAncestorsError);
	}
}


// This function checks if all the necessary files for making a VTC exist in the ProcessedData folder.
// If this is true, the script will skip the step that copies all the data from the FuncDicoms folder.
// Mostly poaches code that EGC wrote in the VTC section of the script.
// Added by VAV 06/12/2013
procObj.getVTCFiles = function(runFolderPath) {
	var folderPathQ = new QDir(runFolderPath); // make qdir object of the folder (which is the experiment-level folder input by the user)
	var procFiles = new Array; // initialize procFiles array
	var fileList = new Array;
	this.writeLog("Searching for files in Processed Data folder " + runFolderPath);
	
	try {
        procFileTemplates = [[/.*fmr$/i,              		runFolderPath, 	1], // 0
                             [/.*stc$/i,                  	runFolderPath, 	1], // 1
                             [/.*vmr$/i,                    runFolderPath,  1], // 2
                             [/.*IA.trf$/i,               	runFolderPath,	0], // 3
                             [/.*FA.trf$/i,               	runFolderPath,	0], // 4
                             [/.*ACPC.trf$/i,             	runFolderPath, 	0], // 5
                             [/.*ACPC.tal$/i,             	runFolderPath, 	0], // 6
                             [/.*prt$/i,                  	runFolderPath, 	0],
                             [/.*3DMC.sdm$/i,             	runFolderPath, 	0]
                             ];
        
        for (filei = 0; filei < procFileTemplates.length; filei++) { // scroll through the templates
            // search for the file template, return the found file name and path and put it in the array of filenames
            findFileObj = findFile(procFileTemplates[filei][0],procFileTemplates[filei][1],procFileTemplates[filei][2]);
            if (findFileObj.DirectoryFlag) {
            	throw("!!! Couldn't find directory " + procFileTemplates[filei][1] + " when looking for the " + procFileTemplates[filei][0] + " file");
            } else if (findFileObj.FileFlag) {
            	this.writeLog("Could not find all the files in the processed data folder... Will copy them over instead.");
                fileList[10]=0;
                return fileList
            } else {
            	procFiles[filei] = findFileObj.FullFileName;
            	fileList[filei] = runFolderPath + procFiles[filei].slice(procFiles[filei].lastIndexOf("/")); // save file path name
            }
//             if (procFiles[filei] != null) { // make sure if found the file it was looking for
//                 fileList[filei] = runFolderPath + procFiles[filei].slice(procFiles[filei].lastIndexOf("/")); // save file path name
//             } else { // couldn't find the file!!
//                 this.writeLog("Could not find all the files in the processed data folder... Will copy them over instead.");
//                 fileList[10]=0;
//                 return fileList
//             }
        }
        
        fileList[10]=1;
	} catch(getVTCFilesError) {
		this.writeLog("!!! Caught error in getVTCFiles:" + getVTCFilesError);
	}
	return fileList
}


// This function opens up the prt, reads through it, and gathers information from it,
// such as the file version, the condition names, etc. PRT format is very rigid, beware.
// Adapted from Vy's Create_SDM.js script.
procObj.parsePRT = function(prt) {
    
    try {
        
        if (prt == null || prt == "<none>") {
        	throw("Trying to parse PRT but no file found");
        }
        
        whitespaceError = "Problem with your PRT. Check the end-of-line whitespace characters (see README).";
        this.writeLog("Parsing " + prt);
        prtQ = new QFile(prt); // make Qfile object from prt
        prtQ.open(new QIODevice.OpenMode(QIODevice.ReadOnly)); // open prt object for reading
        var prtText = new QTextStream(prtQ); // create text stream to read lines
        var currentLine = prtText.readLine(); // read the first line
        // get file version
        while (currentLine.search("FileVersion:") == -1) { // check if current line says file version in it
            currentLine = prtText.readLine(); // if it does not (output is -1), read next line
            if (prtText.atEnd()) {throw(whitespaceError); }
        }
        var version = Number(currentLine.match("\\d")); // use regular expression to find digit
        // get parametric weight, maybe
        var weights = false; // assume it's false unless otherwise proven
        var conditionWeights = new Array; // initialize array that may contain parametric weights; 2D (condition x event)
        if (version > 2) { // v3 is the first with parametric weights
            while (currentLine.search("ParametricWeights:") == -1) {
            	currentLine = prtText.readLine();
            	if (prtText.atEnd()) {throw(whitespaceError); }
            }
            if ( (currentLine.match("\\d") == 1) || (currentLine.search(/true/i) > -1) ) { // if the line is "ParametricWeights: 1" or "...: True" or "...: true"
                weights = true;
            }
            
        }
        // get the number of conditions
        while (currentLine.search("NrOfConditions:") == -1) {
            currentLine = prtText.readLine();
            if (prtText.atEnd()) {throw(whitespaceError); }
        }
        nConditions = Number(currentLine.match("\\d+")); // now have learned number of conditions; again, + is greedy
        // scroll through the number of conditions and pull out their names
        var conditionList = new Array; // initialize list of condition names
        for (var condi = 0; condi < nConditions; condi++) {
            currentLine = prtText.readLine();
            // keep going if line is blank or is just number of instances or says 'color'
            while (currentLine == '\n' || currentLine.search("^\\s*$") != -1 || currentLine.search("^\\s*\\d+\\s*$") != -1 || currentLine.search("^Color.?:") != -1) {
                currentLine = prtText.readLine();
                if (prtText.atEnd()) {throw(whitespaceError); }
            }
            conditionList[condi] = currentLine; // the line found is the name of the condition
            currentLine = prtText.readLine();
            var numEvents = Number(currentLine); // this line after the condition name contains the # of events
            conditionWeights[condi] = new Array; // initialize second dimension of array
            for (var eventi = 0; eventi < numEvents; eventi++) { // scroll through each instance of the condition
				if (prtText.atEnd()) {throw(whitespaceError); }
				
                currentLine = prtText.readLine();
                if (weights) { // get parametric weighting iff you need that sort of thing
					weightTemplate = "\\d+\\s*$";
                    conditionWeights[condi][eventi] = Number(currentLine.match(weightTemplate)); // use regular expressions to get the final number in the line (could be a decimal)
                } else {
                    conditionWeights[condi][eventi] = 1; // if not weighting, just weight it all at 1
                }
            }
        }
        
        prtText.flush();
        prtQ.close();
        
        return { // returns all these as properties of the object the function is returned into
            'FileVersion': version,
            'WeightsOn': weights,
            'CondWeights': conditionWeights,
            'NumConds': nConditions,
            'Conditions': conditionList
        }
    } catch (parsePRTError) {
        this.writeLog("!!! Error parsing PRT: " + parsePRTError);
        return null
    }
}

procObj.parseMocoSDM = function(sdm) {
    
    try {
        
        this.writeLog("Parsing " + sdm);
        sdmQ = new QFile(sdm); // make Qfile object from sdm
        sdmQ.open(new QIODevice.OpenMode(QIODevice.ReadOnly)); // open sdm object for reading
        var sdmText = new QTextStream(sdmQ); // create text stream to read lines
        var currentLine = sdmText.readLine(); // read the first line
        
        // get file version
        while (currentLine.search("FileVersion:") == -1) { // check if current line says file version in it
            currentLine = sdmText.readLine(); // if it does not (output is -1), read next line
        }
        var version = Number(currentLine.match("\\d+")); // use regular expression to find digit; FYI, + is greedy not lazy
        
        // get number of predictors
        while (currentLine.search("NrOfPredictors:") == -1) {
            currentLine = sdmText.readLine();
        }
        var nPredictors = Number(currentLine.match("\\d+"));
        
        // get number of volumes
        while (currentLine.search("NrOfDataPoints:") == -1) {
            currentLine = sdmText.readLine();
        }
        var nVols = Number(currentLine.match("\\d+"));
        
        // includes constant?
        while (currentLine.search("IncludesConstant:") == -1) {
            currentLine = sdmText.readLine();
        }
        var includesConstant = Number(currentLine.match("\\d+"));
        if (nPredictors != 6 && !includesConstant) {
            this.writeLog("!!! WARNING: Current MoCo SDM does not have the correct number of predictors (should have 6 motion directions)");
        }
        
        // first confound predictor (should be 1)
        while (currentLine.search("FirstConfoundPredictor:") == -1) {
            currentLine = sdmText.readLine();
        }
        var firstConfound = Number(currentLine.match("\\d+"));
        
        // find the line with the predictor names (motion directions)
        while (currentLine.search("\\s*\"") == -1) { // finds the next line with quotation marks in it (signifies predictor names line)
            currentLine = sdmText.readLine();
        }
        var removedEndingQuotations = currentLine.slice(currentLine.search("\"")+1,currentLine.lastIndexOf("\"")); // slices current line from first to last index of "
        var predNames = removedEndingQuotations.split("\" \""); // splits the line by quote-space-quote: <" "> to get each predictor
        if (predNames.length != (nPredictors + includesConstant)) {
            this.writeLog("!!! WARNING: Parsed " + predNames.length + " of predictors in MoCo SDM while we predicted " + (nPredictors+includesConstant));
        }
        
        sdmData = new Array;
        for (vol = 0; vol < nVols; vol++) { // scroll through each volume (data point)
            currentLine = sdmText.readLine();
            var parsedLine = currentLine.replace(/[^e]-/g," -"); // makes sure there are spaces between each number; and ignore dashes that follow 'e' which represent sci notation
            parsedLine = parsedLine.slice(parsedLine.search("[\\d|-]")); // lop off any white space at the beginning (save everything after first digit or negative)
            parsedLine = parsedLine.split(/ +/); // split the current line by using a space as a delimiter - treats consecutive delimiters one
            for (predi = 0; predi < (nPredictors+includesConstant); predi++) { // scroll through each predictor and add the data
                if (vol == 0) {sdmData[predi] = new Array;} // if we're on the first volume, initialize the 2nd dimension of the data array
                sdmData[predi][vol] = parsedLine[predi]; // take the sdm value at that volume of the current predictor and save it in the data array
            }
        }
        sdmText.flush();
        sdmQ.close();
        return {
            'FileVersion': version,
            'NumPreds': nPredictors,
            'NumVolumes': nVols,
            'IncludesConstant': includesConstant,
            'FirstSDMConfound': firstConfound,
            'Predictors': predNames,
            'sdmData': sdmData
        }
    } catch (parseMocoSDMError) {
        this.writeLog("!!! Error parsing motion correction SDM: " + parseMocoSDMError);
        return null
    }
}

// This function writes out the mdm
procObj.writeMDM = function(group,ssmList,tcList,designList,mdmBaseName,hemi) {
    
	try {
        
        for (hemii = 0; hemii < hemi.length; hemii++) {
            
            mdmName = mdmBaseName + hemi[hemii] + ".mdm";
            this.writeLog("Writing " + mdmName);
            if (hemi[hemii] == "") {
                fileType = "VTC";
            } else {
                fileType = "MTC";
            }
            
            var mdmVersion = 3; // mdm file version
            var mdm = new QFile(mdmName); // create mdm file
            mdm.open(new QIODevice.OpenMode(QIODevice.WriteOnly)); // open the file
            var mdmLine = new QTextStream(mdm); // create text stream to write lines in the file
            
            mdmLine.writeString("\nFileVersion:\t" + mdmVersion + "\n"); // write in file version
            mdmLine.writeString("TypeOfFunctionalData:\t"+fileType+"\n\n"); // write in: using mtc/vtc data
            mdmLine.writeString("RFX-GLM:\t" + group + "\n\n"); // RFX if group mdm only
            mdmLine.writeString("PSCTransformation:\t0\n"); // PSC transformation
            mdmLine.writeString("zTransformation:\t1\n"); // z transformation (yes)
            mdmLine.writeString("SeparatePredictors:\t0\n\n"); // separate predictors
            mdmLine.writeString("NrOfStudies:\t" + tcList.length + "\n"); // number of time course files (number of studies)
            for (study = 0; study < tcList.length; study++) { // scroll through each vtc/design matrix
                if (hemi[hemii] == "") {
                    anySSM = "";
                } else {
                    anySSM = "\"" + ssmList[study][hemii] + "\" ";
                }
                mdmLine.writeString(anySSM + "\"" + tcList[study][hemii] + "\" \"" + designList[study][hemii] + "\"\n"); // write the vtc path and design matrix path
            }
            mdm.close(); // close and save it out
        }
        return false
	} catch (writeMDMError) {
		this.writeLog("!!! Problem writing MDM: " + writeMDMError);
		return writeMDMError;
	}
}

procObj.writeLog = function(varargin) {
	try {
		if (varargin != Number(varargin)) { // if it's not a number, add it to the log
			bvqx.PrintToLog(varargin);
			this.runningLog[this.runningLog.length] = varargin;
		} else { // varargin is the project type index
			// build the date: YYYY-MM-DD_HH.MM.SS
			dateString = Date().match(/\s20\d\d\s/)[0].match(/\d+/)[0] + "-" + convertValue(Date().match(/\s\w+\s/)[0].match(/\w+/)[0]) + "-" +
						 Date().match(/\s\w+\s\d+\s/)[0].match(/\d+/)[0] + "_" + Date().match(/\d+:\d+:\d+/)[0].replace(/:/g,".");
			filename = encompassingFolder + "/" + dateString + "_" + convertValue(varargin) + ".txt";
			file = new QFile(filename);
			file.open(new QIODevice.OpenMode(QIODevice.WriteOnly));
			logTextStream = new QTextStream(file);
			this.saveSettings(logTextStream);
			logTextStream.writeString("\n\n\n***************************\n\nSTART OF OUTPUT LOG\n\n")
			for (line = 0; line < this.runningLog.length; line++) {
				logTextStream.writeString(this.runningLog[line] + "\n");
			}
			file.close();
		}
	} catch (writeLogError) {
		bvqx.PrintToLog("!!! Error writing log: " + writeLogError);
		throw(writeLogError);
	}
}

procObj.finishScript = function(errArray,startTime,totalRunCount) {
	this.writeLog("\n******\n******\nStarted at " + startTime);
	this.writeLog("Completed working on " + totalRunCount + " runs of data" + ((errArray.length==0)?" with no errors!":" but found the following "+errArray.length+" errors:"));
	if (errArray.length>0) {
		this.writeLog("NOTE THE SYNTAX OF THE FOLLOWING LIST OF ERRORS:");
		this.writeLog("Subject number (experiment-not fMRI), Run number, Experiment name, Step in the script, Actual error that BrainVoyager threw");
		for (erri = 0; erri < errArray.length; erri++) { // scroll through each error caught during processing step
			this.writeLog(errArray[erri]);
		}
	}
	this.writeLog("Finished at " + Date() + "\n******\n******\n");
}

// This function finds the first directory or file within a directory
// (does not check sub-dirs) that matches pattern. Returns full file
// name with absolute path. When mode is 0 return just the first file.
// When mode is 1, return only the longest filename. When mode is 2, 
// return all of them in a list, when mode is a string, it finds all
// the matching files and cues user to pick the correct one (mode will
// be the extension we're looking for). If mode is a string, supplemental
// will be offered as a cue for what it's looking for.
findFile = function(pattern, dir, mode, supplemental) {
	
    try {
    	fullFile = null; // assume null
    	dirFlag = false;
    	fileFlag = false;
        if (dir == null) { // WOULD THIS EVER HAPPEN?
            throw("THE DIRECTORY IN WHICH YOU ARE SEARCHING CANNOT BE FOUND.");
        }
        var found = false; // assume it didn't find the file
        var fileName = "";
        var tempName; // initialize temporary variable
        var dirQ = new QDir(dir); // make QDir object of the directory so we can manipulate it
        if 	(!dirQ.exists(dir)) {
        	dirFlag = true;
        	throw("THE DIRECTORY IN WHICH YOU ARE SEARCHING CANNOT BE FOUND.");
        }
        var dirQFiles = dirQ.entryList(); // get all the sub-files and sub-folders of the directory
        for (i = 0; i < dirQFiles.length; i++) { // scroll through each those sub-files
            if (dirQFiles[i].match(pattern) != null) { // found file that matches the pattern given
                tempName = dirQFiles[i]; // save the filename in temporary variable
                found = true; // did find it
				if (mode == 0) { // simply return the first file found that fits the pattern
                    fileName = tempName; // temporary filename becomes the one that will be returned
                    break; // stop the FOR loop
            	} else if (mode == 1 && fileName.length < tempName.length) { // compares the length of the previously longest and currently found
					fileName = tempName; // if the currently found file's name is longer, old one gets replaced
                } else if (mode == 2 || mode.toString() === mode) { // return all of them or cue user 
					if (fileName == "") {
						fileName = new Array;
					}
					fileName[fileName.length] = tempName;
                }
            }
        }
    } catch (findFileError) {
        procObj.writeLog("!!! Error trying to find file: " + findFileError);
        procObj.writeLog("!!! Searching for template " + pattern + " in directory " + dir);
    }
	if (found) {
		if (mode == 2) {
			fullFile = new Array;
			for (i = 0; i < fileName.length; i++) {
				fullFile[fullFile.length] = dir + "/" + fileName[i];
			}
		} else if (mode.toString() === mode && fileName.length > 1) { // cue user to pick
			bvqx.CurrentDirectory = dir;
			if (supplemental.type == "File") {
				var fullFile = bvqx.BrowseFile(supplemental.cue, mode); // returns full file path
			} else if (supplemental.type == "Directory") {
				var fullFile = bvqx.BrowseDirectory(supplemental.cue); // returns full path
			}
		} else {
			var fullFile = dir + "/" + fileName; // if it found a matching file, get the full path
		}
    } else {
    	fileFlag = true;
    }
// 	return fullFile
	return { // returns all these as properties of the object the function is returned into
            'FullFileName': fullFile,
            'DirectoryFlag': dirFlag,
            'FileFlag': fileFlag,
            'SearchDirectory': dir,
            'FilePattern': pattern,
            'Mode': mode
        }
}

// converts months and project
convertValue = function(varargin) {
	if (varargin.toString() === varargin) { // month >> number
		if      (varargin.search("Jan") > -1) {varargout = "01";}
		else if (varargin.search("Feb") > -1) {varargout = "02";}
		else if (varargin.search("Mar") > -1) {varargout = "03";}
		else if (varargin.search("Apr") > -1) {varargout = "04";}
		else if (varargin.search("May") > -1) {varargout = "05";}
		else if (varargin.search("Jun") > -1) {varargout = "06";}
		else if (varargin.search("Jul") > -1) {varargout = "07";}
		else if (varargin.search("Aug") > -1) {varargout = "08";}
		else if (varargin.search("Sep") > -1) {varargout = "09";}
		else if (varargin.search("Oct") > -1) {varargout = "10";}
		else if (varargin.search("Nov") > -1) {varargout = "11";}
		else if (varargin.search("Dec") > -1) {varargout = "12";}
	} else { // project number >> name
		if 	    (varargin == -1) {varargout = "MoveFiles";}
		else if (varargin == 0)  {varargout = "FMR";}
		else if (varargin == 1)  {varargout = "VMR";}
		else if (varargin == 2)  {varargout = "VTC";}
		else if (varargin == 3)  {varargout = "SDM";}
		else if (varargin == 4)  {varargout = "MDM";}
		else if (varargin == 5)  {varargout = "MTC";}
	}
	return varargout
}

/****************************************************************************/
/****************************** RUN THE SCRIPT ******************************/
/****************************************************************************/

// controls all the fmr object's methods by recognizing when the user
// has interacted with the gui and calling the appropriate method
procObj.initDlg = function() {
//     this.defaults = this.retrieveDefaults(this); // gets the defaults
	this.procDialog.windowTitle = "Data Preprocessing"; // names the gui dialog box
	
	this.pages = new Array;
	this.runningLog = new Array;
	this.registerMoveBoxChanges("new");

	this.procDialog.main.widget(moveFiles).rawDataPathAddAnother.clicked.connect(this, this.rawDataPathAddAnotherClicked);
	this.procDialog.main.widget(moveFiles).pageUp.clicked.connect(this, this.pageUp);
	this.procDialog.main.widget(moveFiles).addPage.clicked.connect(this, this.addNewPage); // add a page to the move files gui
    this.procDialog.main.widget(moveFiles).makeDuplicatePage.clicked.connect(this, this.addDuplicatePage);
	this.procDialog.main.widget(moveFiles).pageDown.clicked.connect(this, this.pageDown);
	this.procDialog.main.widget(moveFiles).addMoveRow.clicked.connect(this, this.addMoveRow); // add a row to the move files table
	this.procDialog.main.widget(moveFiles).setMoveDataPath.clicked.connect(this, this.setMoveDataPath); // set output path for moving files
	this.procDialog.main.widget(moveFiles).dateMRICheckBox.stateChanged.connect(this, this.changeDateMRI); // toggle date box for raw data
	this.procDialog.main.widget(moveFiles).moveSavePages.clicked.connect(this, this.moveSavePages);
	this.procDialog.main.widget(moveFiles).moveLoadPages.clicked.connect(this, this.moveLoadPages);
    
    this.procDialog.main.widget(preprocessFiles).setTalTemplate.clicked.connect(this, this.setTalTemplate);
	this.procDialog.main.widget(preprocessFiles).preprocess.widget(FMR).doSliceTimeCorrection.stateChanged.connect(this, this.changeSliceTimeCorrection); // stc box toggle
	this.procDialog.main.widget(preprocessFiles).preprocess.widget(FMR).doMotionCorrection.stateChanged.connect(this, this.changeMotionCorrection); // moco box toggle
    this.procDialog.main.widget(preprocessFiles).preprocess.widget(FMR).doTemporalHighPassFiltering.stateChanged.connect(this, this.changeTemporalHighPassFiltering); // thp box toggle
    this.procDialog.main.widget(preprocessFiles).preprocess.widget(FMR).doTemporalSmoothing.stateChanged.connect(this, this.changeTemporalSmoothing); // tgs box toggle
    this.procDialog.main.widget(preprocessFiles).preprocess.widget(FMR).fmrDoSpatialSmoothing.stateChanged.connect(this, this.changeSpatialSmoothing); // sgs box toggle
    this.procDialog.main.widget(preprocessFiles).preprocess.widget(VMR).makeISO.stateChanged.connect(this, this.changeMakeISO);
    this.procDialog.main.widget(preprocessFiles).preprocess.widget(VTC).vtcDoSpatialSmoothing.stateChanged.connect(this, this.changeSpatialSmoothing); // sgs box toggle
    this.procDialog.main.widget(preprocessFiles).preprocess.widget(MTC).mtcTemplateSurfaceBool.stateChanged.connect(this, this.changeMTCTemplateSurfaceBrain);
    
    this.procDialog.main.widget(preprocessFiles).preprocess.currentChanged.connect(this, this.tabChanged); // resize window if tab changed
    this.procDialog.main.widget(preprocessFiles).preprocessAddRow.clicked.connect(this, this.preprocessAddRow); // add row to subject table
    this.procDialog.main.widget(preprocessFiles).saveSettings.clicked.connect(this, this.saveSettings); // save the preprocessing settings
    this.procDialog.main.widget(preprocessFiles).loadSettings.clicked.connect(this, this.loadSettingsFromNavigator); // load a preprocessing settings by navigating to file
    this.procDialog.main.widget(preprocessFiles).restoreDefaults.clicked.connect(this, this.loadSettingsFromDefaults); // reset defaults upon Defaults button click
    this.procDialog.main.widget(preprocessFiles).subjectTable.cellDoubleClicked.connect(this, this.browsePathFolder); // browse to path folder
    
    this.procDialog.decisionButton.rejected.connect(this, this.cancelProj); // cancel project
    this.procDialog.decisionButton.accepted.connect(this, this.runProj); // run preprocessing upon OK button click
}

returnProcObj = function() {
    return procObj;
}

returnProcObj();
