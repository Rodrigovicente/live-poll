export type ApiResponse<T> =
	| {
			success: true
			payload: T
	  }
	| {
			success: false
			error: {
				message: string
				code?: string
			}
	  }
