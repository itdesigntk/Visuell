//  PREREQUISITES
var CLIENT_ID = '659653087009-if2rcthrj1c6rtllo7bmsr8oioi1j24r.apps.googleusercontent.com';
var API_KEY = 'AIzaSyDu2DqaRCF4qCG71hhLZ-Ptlnve1fGDh-8';
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/classroom/v1/rest"];

// Authorization scopes required by the API; multiple scopes can be included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.students.readonly https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly  https://www.googleapis.com/auth/classroom.topics.readonly ';



gapi.load("client:auth2", function() {
    gapi.auth2.init({
		client_id: "659653087009-if2rcthrj1c6rtllo7bmsr8oioi1j24r.apps.googleusercontent.com"
	}).then(function () {
		//gapi.auth2.getAuthInstance().signOut()

		gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
		updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
	
	}, function(error) {console.log(JSON.stringify(error, null, 2));});
});



function authenticate() {
    gapi.auth2.getAuthInstance().signIn({scope: " https://www.googleapis.com/auth/classroom.courses.readonly  https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/classroom.coursework.students.readonly https://www.googleapis.com/auth/classroom.courseworkmaterials https://www.googleapis.com/auth/classroom.topics.readonly"}).then(function() { 
        console.log("Sign-in successful"); 
    }, function(err) {console.error("Error signing in", err);});
}

function loadClient() {
    gapi.client.setApiKey("AIzaSyDu2DqaRCF4qCG71hhLZ-Ptlnve1fGDh-8");
    gapi.client.load("https://classroom.googleapis.com/$discovery/rest?version=v1").then(function() { 
        console.log("GAPI client loaded for API"); 
		getCourseList()
    }, function(err) { console.error("Error loading GAPI client for API", err);});
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
		var user = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
		userThings(user);
		loadClient()
    } else {
		console.log('signed out')
		authenticate()
    }
}


function userThings (user) {
    var id = user.getId()
    var fullName = user.getName()
    var givenName = user.getGivenName()
    var familyName = user.getFamilyName()
    var imgURL = user.getImageUrl()
    var email = user.getEmail()

	console.log(email, fullName)
}

//
//

function getCourseList () {
    gapi.client.classroom.courses.list({
		"courseStates": [
		  "ACTIVE"
		],
		"studentId": "me"
	}).then(function(response) {
		const courses = response.result.courses
		var wrap = document.querySelector('.sidebar')
		wrap.innerHTML = null


		var last = false
		var check;

		for (var i = 0; i < courses.length; i++) {
			(function(i) {
				if (i == (courses.length - 1)) {
					last = true
				}

				function appendClass () {
					clearTimeout(check)

					wrap.appendChild(helper_createSideBarHTML(courses[i].name, courses[i].id))
					if (last == true) {
						check = setTimeout(function(){
							startPage()
						}, 1500)
						return;
					} 
				}
	
				gapi.client.classroom.courses.courseWork.list({
					"courseId": courses[i].id,
					"orderBy": "updateTime",
					"pageSize": 1
				}).then(function(response) {
					if (response.result.courseWork == null) {
						gapi.client.classroom.courses.courseWorkMaterials.list({
							"courseId": courses[i].id,
							"orderBy": "updateTime",
							"pageSize": 1
						}).then(function(response) {
							if (response.result.courseWorkMaterial == null) return;
							appendClass()
						})
					} else {
						appendClass()
					}
					clearSessionCourseWork()
				})


			})(i)
		}



		console.log("Course List: ", courses);
	}), function(error) {
		console.error(error)
	}
}

function getCourseWork (CID, passive) {
	if (localStorage.getItem(CID) && passive != true) {
		console.log("loading a saved course")
		displaySavedCourseWork(CID);
		return;
	} 
	// Ok, here we go. Trying to make this as easy to read as possible.

	// Make sure the DOM element is empty.
	var wrap = document.querySelector('.assignmentList');

	if (passive != true) wrap.innerHTML = null


	// Write a function to get the course topics
	function getTheTopics () {
		gapi.client.classroom.courses.topics.list({
			"courseId": CID
		}).then(function(response) {
			// If there are no topics, STOP!
			if (response.result.topic) {} else {
				return;
			}
			// call a function 
			getTheWork(response.result.topic)

		})
	}
	getTheTopics()

	var currentTopicName;

	// Write a function to get the coursework (within a specific topic ID)
	function getTheWork (topics) {
		// Get the work for the course
		gapi.client.classroom.courses.courseWork.list({
			"courseId": CID,
			"orderBy": "updateTime",
		}).then(function(response) {
			var courseWorkArray;
			var courseWorkArrayEmpty;
			var masterArray;
			// If there is no work: set the array to empty
			if (response.result.courseWork == null) {
				courseWorkArrayEmpty = true
				courseWorkArray = [];
			} else {
				courseWorkArray = response.result.courseWork;
			}

			// Get the material for the course
			gapi.client.classroom.courses.courseWorkMaterials.list({
				"courseId": CID,
				"orderBy": "updateTime"
			}).then(function(response) {
				// If there is no course material AND no course work, STOP!
				if (response.result.courseWorkMaterial == null && courseWorkArrayEmpty == true) return;

				// Combine material and work arrays
				array_to_push = response.result.courseWorkMaterial
				masterArray = courseWorkArray.concat(array_to_push)

				var topicLessItems = [];

				// For each topic, check if the item is in the topic:
				topics.forEach(function(t) {

					// FOR EACH ITEM IN THE COMBINED ARRAY:
					masterArray.forEach(function(c) {
						const courseItemId = c.topicId
						const topicId = t.topicId

						// IF THE ITEM IS IN THE COURSE AND NOT UNDER A TOPIC
						var dup = false

						if (c.topicId){} else {
							for (var i = 0; i < topicLessItems.length; i++) {
								if (topicLessItems[i] == c.id) {
									dup = true;
									break;
								} 
							}

							if (dup == true){
								dup = false
								return;
							}

							if (passive == true) {
								displayCourseWork(c, true, false, false, false)
							} else {
								displayCourseWork(c, false, false, false, false)
							}
							
							topicLessItems.push(c.id)
							return;
						}



						// HERE!! IF THE TOPIC ID ISN'T THE SAME AS THE ITEM'S TOPIC ID:
						if (topicId != courseItemId) {
							return;
						}


						// If the topic is different from the previous one:
						if (currentTopicName) {
							if (currentTopicName != t.name) {
								//console.log('The topic has changed to:', t)
								currentTopicName = t.name;
								if (passive == true) {
									displayCourseWork(undefined, true, true, t)
								} else {
									displayCourseWork(undefined, false, true, t)
								}
							}
						} else {
							currentTopicName = t.name;
							if (passive == true) {
								displayCourseWork(undefined, true, true, t)
							} else {
								displayCourseWork(undefined, false, true, t)
							}
						}
						

						// If we are "pre-loading", or passively loading then pass that
						// as true into our function
						if (passive == true) {
							displayCourseWork(c, true)
							return;
						}

						// Otherwise, it is a user-initiated action which we will display
						displayCourseWork(c)
					})
				})
			})
		})
	}

}



