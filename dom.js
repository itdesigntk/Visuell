// Start 
function startPage () {
    document.getElementsByClassName('courseName')[0].click()
    document.querySelector('.classind').style.opacity = '1'

    $(document).ready(function() {
        $('.js-example-basic-single').select2();
    });
}



// Declare all helper functions here:
function helper_parseDate (date, format) {
    return moment(date, format).format('MMM D') 
}

function goToChildLink (el) {
    window.open(el.children[0].classList[0])
}

function helper_createAssignmentHTML (title, dueDate, pts, desc, att) {
    var HTML = `
    <div class="title">`+ title +`</div>
    <div class="points">`+ pts +`</div>
    <div class="dueDate">`+ dueDate +`</div>

    <div class="desc">`+ desc +`</div>
    <div class="attachments">`+ att +`</div>
   `

    var pushWrap = document.createElement('div'); 
    pushWrap.classList.add('assignment')
    pushWrap.innerHTML = HTML

    if (pushWrap.children[4].children[0]) {
        Array.prototype.forEach.call(pushWrap.children[4].children[0].children, function(el) {
            el.setAttribute("onclick", "goToChildLink(this)")
        })
    } 


    return pushWrap
} 

function helper_createTopicHeaderHTML (name) {
    var HTML = `
    <div class="topicName">`+ name +`</div>
   `

    var pushWrap = document.createElement('div'); 
    pushWrap.classList.add('topicHeader')
    pushWrap.innerHTML = HTML

    return pushWrap
}

function helper_createSideBarHTML (classTitle, id) {

    var pushWrap = document.createElement('span'); 
    pushWrap.classList.add('courseName')
    pushWrap.classList.add(id)
    pushWrap.innerHTML = classTitle

    pushWrap.onclick = function () {
        getCourseWork(this.classList[1]);
        Array.prototype.forEach.call(document.getElementsByClassName('courseName'), function(el) {
            el.classList.remove('active')
        })
        this.classList.add('active')

        var elClicked = this

        Array.prototype.forEach.call(document.querySelector('.classind').children, function(option) {
            if (option.innerHTML == elClicked.innerHTML) {
                document.querySelector('.classind').value = option.value
            } 
        })
    }

    var optEl = document.createElement('option')
    optEl.value = classTitle
    optEl.innerHTML = classTitle

    document.querySelector('.classind').appendChild(optEl)

    getCourseWork(id, true);
    return pushWrap
} 

function helper_createAttachmentHTML (att) {
    var pushWrap = document.createElement('button');
    pushWrap.classList.add('attachmentItem');
    pushWrap.classList.add('attachmentItem');
    
    var url;
    var title;
    var name = Object.keys(att)[0]

    if (name == 'link') {
        url = att.link.url
        title = att.link.title
    } else if (name == 'driveFile') {
        url = att.driveFile.driveFile.alternateLink
        title = att.driveFile.driveFile.title
    } else if (name == 'form') {
        url = att.form.formUrl
        title = att.form.title
    } else if (name == 'youtubeVideo') {
        url = att.youtubeVideo.alternateLink
        title = att.youtubeVideo.title
    } 

    var HTML = `
    <div class="`+ url +`" href="`+ url +`">`+ title +`</div>
    `
    pushWrap.innerHTML = HTML;

    return pushWrap
}


//////////////////////
//////////////////////
//////////////////////
// Google Classroom //
//////////////////////
//////////////////////
//////////////////////


var currentCourseId
var queryCourseId


// Display a course topic
function displayCourseTopic (t, passive) {
    var name = t.name

    const wrap = document.querySelector('.assignmentList');
    const dummyWrap = document.querySelector('.DUMMYassignmentList');

    if (passive == true) {
        dummyWrap.appendChild(helper_createTopicHeaderHTML(name))
        saveCourseWork(t.courseId, dummyWrap.innerHTML)
        return;
    }

    wrap.appendChild(helper_createTopicHeaderHTML(name))
    saveCourseWork(t.courseId, wrap.innerHTML)
}

// Display a coursework/material
function displayCourseWork (work, passive, isTopicHeader, topic, hasTopic) {
    const wrap = document.querySelector('.assignmentList');
    const dummyWrap = document.querySelector('.DUMMYassignmentList');

    if (work) {
        queryCourseId = work.courseId
    } else {
        queryCourseId = topic.courseId
    }


    if (currentCourseId && currentCourseId != queryCourseId && passive == true) {
        dummyWrap.innerHTML = null;
    }

    if (isTopicHeader == true) {
        currentCourseId = topic.courseId;
        displayCourseTopic(topic, passive)
        return;
    }

    var title = work.title

    var desc; desc = ''
    if(work.description) desc = work.description

    var pts = work.maxPoints

    var workAtts;
    workAtts = ''

    if (work.materials) {
        var tmpWrap = document.createElement('div')
        Array.prototype.forEach.call(work.materials, function(mat) {
            tmpWrap.appendChild(helper_createAttachmentHTML(mat))
            workAtts = tmpWrap.outerHTML;
        })
    }

    var dueDate;
    dueDate = ''

    if (work.dueDate) {
        dueDate = 'Due ' + helper_parseDate(work.dueDate.year + ' ' + work.dueDate.month + ' ' + work.dueDate.day, 'YYYY M D') 
    } 
    if (work.dueTime) {
        if (work.dueTime.minutes && work.dueTime.hours) {
            
        } else {
            dueDate = dueDate + ', ' 
            if (work.dueTime.minutes) {
                dueDate = dueDate + ' ' + work.dueTime.hours + ':' + work.dueTime.minutes
            }
            if (work.dueTime.hours) {
                dueDate = dueDate + ' ' + moment(work.dueTime.hours, 'H').format('h:mm A') 
            }
        }
    }  

    currentCourseId = work.courseId;

    if (pts === undefined) {
        pts = '' 
    } else if (parseInt(pts) > 1) {
        pts = pts + 'pts'
    } else {
        pts = pts + 'pt'
    }

    if (hasTopic == false) {
        if (passive == true) {
            dummyWrap.insertBefore(helper_createAssignmentHTML(title, dueDate, pts, desc, workAtts), dummyWrap.firstChild)
            saveCourseWork(work.courseId, dummyWrap.innerHTML)
            return;
        }
    
        wrap.insertBefore(helper_createAssignmentHTML(title, dueDate, pts, desc, workAtts), wrap.firstChild)
        saveCourseWork(work.courseId, wrap.innerHTML)
        return;
    }

    if (passive == true) {
        dummyWrap.appendChild(helper_createAssignmentHTML(title, dueDate, pts, desc, workAtts))
        saveCourseWork(work.courseId, dummyWrap.innerHTML)
        return;
    }

    wrap.appendChild(helper_createAssignmentHTML(title, dueDate, pts, desc, workAtts))
    saveCourseWork(work.courseId, wrap.innerHTML)
}


// Display a locally saved course
function displaySavedCourseWork (id) {
    document.querySelector('.assignmentList').innerHTML = localStorage.getItem(id)
}

// Clear the locally saved courses
function clearSessionCourseWork () {
    if (document.getElementsByClassName('courseName')) {
        Array.prototype.forEach.call(document.getElementsByClassName('courseName'), function(el) {
            var idToRemove = el.classList[1]
            localStorage.removeItem(idToRemove)
        })
    }
}

// Save a course
function saveCourseWork (id, HTML) {
    localStorage.setItem(id, HTML)
}


// ALL ANIMATIONS / UI 

var button = document.querySelector('.classind');

button.onclick = switchClass

function switchClass () {

}
