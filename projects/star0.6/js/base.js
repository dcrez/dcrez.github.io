"use strict";
// container for Salesforce array returned by HTTP request 
var starjobs = [];
var split_focus = [];

// URL of Salesforce service endpoint
var apiurl = "https://starcollaborativeportal.secure.force.com/services/apexrest/JobPortal";

// Request data from Salesforce 
var xhr = new XMLHttpRequest(); //console.log('UNSENT', xhr.readyState);

xhr.open('GET', apiurl + "?t=" + Math.random(), false);
console.log('OPENED', xhr.readyState);

xhr.onreadystatechange = function() {
    if (xhr.readyState === 3) {
        console.log('LOADING', this.readyState);
    } else if (this.readyState === 4 && this.status === 200) {
        starjobs = JSON.parse(xhr.responseText);
        console.log("DONE!");
    } else { console.log("unhandled condition!"); }
};

xhr.send();

sessionStorage.setItem('starjobs', JSON.stringify(starjobs));


// Populate list of jobs prior to user filtering list
//Define template to view jobs
var jobsTemplate = $("#jobs_template").html();

//Compile template
var compiledJobs = Handlebars.compile(jobsTemplate);

//Define variable to display template
var $jobs = $("#content");

if ($("body").hasClass("job_details")) {} else {
    $jobs.html(compiledJobs(starjobs));
    console.log(starjobs);
}


var sessionJobs = sessionStorage.getItem('starjobs');


// Build arrays for dropdowns
//Define unique job types
const arr_jobtypes = [...new Set(starjobs.map(item => item.Job_Type__c))];
var frm_jobtypes = document.getElementById("job_types");
for (var i = 0; i < arr_jobtypes.length; i++) {
    var jt = arr_jobtypes[i];
    var el = document.createElement("option");
    el.textContent = jt;
    el.value = jt;
    frm_jobtypes.appendChild(el);
}

// Define unique locations
const arr_locations = [...new Set(starjobs.map(item => item.AVTRRT__State__c))];
var frm_locations = document.getElementById("locations");
for (var i = 0; i < arr_locations.length; i++) {
    var loc = arr_locations[i];
    var el = document.createElement("option");
    el.textContent = loc;
    el.value = loc;
    frm_locations.appendChild(el);
}


// Need to fix to not use underscore JS
// Define unique focus areas
var arr_focus_areas = [...new Set(starjobs.map(item => item.MC_IntersetGroup__c))];

const clean_focus = arr_focus_areas.filter(function(n) { return n !== undefined });

arr_focus_areas = clean_focus;

var split_focus = [];
var frm_focus = document.getElementById("focus_areas");

// Break out focus areas
for (var i = 0; i < arr_focus_areas.length; i++) {
    for (var i = 0; i < arr_focus_areas.length; i++) {
        //var fcs_item = arr_focus_areas[i];
        var fcs_item = arr_focus_areas[i].split(";"); // just split once
        split_focus.push(fcs_item[0]); // before the dot
        split_focus.push(fcs_item[1]); // after the dot 
    }
}

// Remove undefined items from focus areas
var clean_fcs_areas = split_focus.filter(function(n) { return n !== undefined });
var ordered_fcs_areas = _.sortBy(clean_fcs_areas)
const arr_fcs_clean = [...new Set(clean_fcs_areas)];

var frm_focus = document.getElementById("focus_areas");
for (var i = 0; i < arr_fcs_clean.length; i++) {
    var fa = arr_fcs_clean[i];
    var el = document.createElement("option");
    el.textContent = fa;
    el.value = fa;
    frm_focus.appendChild(el);
}

var loc;
var jt;
var fcs; //form values
var result = []; //filter variables
var filtered_results = [];


function dosubmit() {
    //set variables
    loc = document.getElementById("locations").value;
    jt = document.getElementById("job_types").value;
    fcs = document.getElementById("focus_areas").value;
    var loc_result = [];
    var jt_result = [];
    var fcs_result = [];
    var combined_jobs = [];

    // Create filtered array for locations
    for (var i = 0; i < starjobs.length; i++) {
        if (loc !== null && starjobs[i].AVTRRT__State__c === loc) {
            loc_result.push(starjobs[i]);
            console.log("loc:" + loc_result);
            combined_jobs = _.intersection(starjobs, loc_result);
            starjobs = combined_jobs;
        }
    } //if the location filter is selected, add all jobs that match to the location array
    // Create filtered array for job types (contract, direct hire, etc.)
    for (var j = 0; j < starjobs.length; j++) {
        if (jt !== null && starjobs[j].Job_Type__c === jt) {
            jt_result.push(starjobs[j]);
            console.log("jt:" + jt_result);
            combined_jobs = _.intersection(starjobs, jt_result);
            starjobs = combined_jobs;
        }
    } //if the job type filter is selected, add all jobs that match to the job type array
    // Create filtered array for focus groups (business analysis, project management, etc.)
    for (var m = 0; m < starjobs.length; m++) {
        if (fcs !== null) {
            fcs_result = _.where(starjobs[m], "MC_IntersetGroup__c:" & fcs);
            console.log("fcs:" + fcs_result);
            combined_jobs = _.intersection(starjobs, fcs_result);
            starjobs = combined_jobs;
        }
    }

    combined_jobs = _.uniq(starjobs);

    if (combined_jobs.length < 1) {
        document.getElementById("form_error").innerHTML = 'We cannot find any opportunities that match the criteria you provided. Try <a href="#" class="fn-reset">searching again</a> or <a href="#" data-toggle="modal" data-target="#subscribeModal">subscribe</a> to get alerts about new roles as they become available.';
    } else {
        document.getElementById("form_error").innerHTML = "";
    }
}

$("#starform").click(function() {
    console.log("clicked submit!");
    var data = $('#starform').serialize();
    xhr.open("GET", apiurl + "/?" + data, false);
    xhr.send();
    dosubmit();
    if ($("body").hasClass("job_details")) {} else {
        $jobs.html(compiledJobs(starjobs));
        console.log(starjobs);
    }
    event.preventDefault();
    console.log("completed submit!");
});