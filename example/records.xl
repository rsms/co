type User {
  first_name string
  last_name string
  id int
  year_born int = 0
  var seen_count int
  
  name() string {
    "${@first_name} ${@last_name}"
  }
  
  age() int {
    if @year_born > 0 {
      d = date.now()
      d.year - @year_born
    }
    // default value is return type init
  }
}

User.hasId() {
  @id != 0 && @
}

var nextId int
makeUser(args... paramof<User>) {
  User(...args, id=nextId++)
}

u = makeUser("Bob", "Smith", year_born=1983)
log(u)

// User(first_name="Bob", last_name="Smith",
//  id=0, year_born=1983, seen_count=0)

x = (a, b) // tuple
x = (a, b int) { a * b } // function
